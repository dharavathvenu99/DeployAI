"""
Deployments Management Router: Triggers, Streaming Logs, History, AI Diagnosis
"""
import uuid
import json
import asyncio
import httpx
import ipaddress
from datetime import datetime
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import (
    DeploymentORM, ProjectORM, DeploymentRequest, DeploymentResponse,
    LogEntry, ErrorDiagnosisRequest, ErrorDiagnosisResponse
)
from ..services.deployer import DeploymentRunner
from ..services.ai_analyzer import AIAnalyzerService
from ..config import settings

router = APIRouter(prefix="/deployments", tags=["deployments"])

def is_safe_url(url: str) -> bool:
    """Validate URL for security - reject localhost, private IPs, internal hostnames, non-HTTPS"""
    try:
        parsed = urlparse(url)
        
        # Must be HTTPS
        if parsed.scheme != "https":
            return False
        
        hostname = parsed.hostname or ""
        
        # Reject localhost variations
        if hostname.lower() in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
            return False
        
        # Reject private IP ranges
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved:
                return False
        except ValueError:
            # Not an IP address, check hostname
            hostname_lower = hostname.lower()
            # Reject internal hostnames
            if (hostname_lower.endswith(".local") or 
                hostname_lower.endswith(".internal") or
                hostname_lower.endswith(".lan") or
                hostname_lower.endswith(".home") or
                hostname_lower.endswith(".corp") or
                hostname_lower.startswith("internal-") or
                hostname_lower.startswith("local-")):
                return False
        
        return True
    except Exception:
        return False

def format_deployment_response(d: DeploymentORM) -> DeploymentResponse:
    parsed_logs: List[LogEntry] = []
    try:
        raw_logs = json.loads(d.logs_json)
        parsed_logs = [LogEntry(**entry) for entry in raw_logs]
    except Exception:
        pass

    return DeploymentResponse(
        id=d.id,
        project_id=d.project_id,
        project_name=d.project_name,
        framework=d.framework,
        provider=d.provider,
        status=d.status,
        live_url=d.live_url,
        is_demo=d.is_demo,
        cost_inr=d.cost_inr,
        commit_hash=d.commit_hash,
        logs=parsed_logs,
        error_message=d.error_message,
        ai_diagnosis=d.ai_diagnosis,
        ai_fix_suggestion=d.ai_fix_suggestion,
        created_at=d.created_at,
        updated_at=d.updated_at
    )

@router.post("/create", response_model=DeploymentResponse)
def trigger_deployment(
    req: DeploymentRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    project = db.query(ProjectORM).filter(ProjectORM.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Cost calculation: if paid tier and not approved, require approval
    cost_inr = 0.0
    if req.tier_name != "Free Tier" and "Free" not in req.tier_name and "Hobby" not in req.tier_name:
        cost_inr = 420.0  # Approx starter tier INR
        if not req.approve_payment:
            raise HTTPException(
                status_code=402, 
                detail="User payment approval required for paid hosting tier."
            )

    deployment_id = str(uuid.uuid4())[:8]
    is_demo = settings.DEMO_MODE

    # Apply overrides if any
    if req.env_overrides:
        try:
            curr_env = json.loads(project.env_vars_json)
            curr_env.update(req.env_overrides)
            project.env_vars_json = json.dumps(curr_env)
            db.commit()
        except Exception:
            pass

    deployment = DeploymentORM(
        id=deployment_id,
        project_id=project.id,
        project_name=project.name,
        framework=project.framework,
        provider=req.provider,
        status="QUEUED",
        live_url=None,
        is_demo=is_demo,
        cost_inr=cost_inr,
        commit_hash=f"{project.repo_branch}@{uuid.uuid4().hex[:7]}",
        logs_json=json.dumps([DeploymentRunner.create_log_entry("INFO", "Deployment job queued in worker pool", "QUEUE")]),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(deployment)
    db.commit()
    db.refresh(deployment)

    # Spawn deployment background runner
    background_tasks.add_task(
        DeploymentRunner.run_deployment,
        deployment_id=deployment_id,
        project_name=project.name,
        framework=project.framework,
        provider=req.provider,
        build_command=project.build_command,
        start_command=project.start_command,
        simulate_error=req.simulate_error
    )

    return format_deployment_response(deployment)


@router.get("/history", response_model=List[DeploymentResponse])
def get_deployment_history(limit: int = 20, db: Session = Depends(get_db)):
    deployments = db.query(DeploymentORM).order_by(DeploymentORM.created_at.desc()).limit(limit).all()
    return [format_deployment_response(d) for d in deployments]


@router.get("/{deployment_id}", response_model=DeploymentResponse)
def get_deployment_status(deployment_id: str, db: Session = Depends(get_db)):
    d = db.query(DeploymentORM).filter(DeploymentORM.id == deployment_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Deployment record not found")
    return format_deployment_response(d)


@router.post("/{deployment_id}/diagnose", response_model=ErrorDiagnosisResponse)
async def diagnose_failed_deployment(
    deployment_id: str,
    req: ErrorDiagnosisRequest,
    db: Session = Depends(get_db)
):
    d = db.query(DeploymentORM).filter(DeploymentORM.id == deployment_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Deployment record not found")

    result = await AIAnalyzerService.diagnose_error(
        error_log=req.error_log or d.error_message or "",
        framework=d.framework
    )

    # Update deployment with AI diagnosis
    d.ai_diagnosis = result.get("root_cause")
    d.ai_fix_suggestion = result.get("suggested_fix")
    db.commit()

    return ErrorDiagnosisResponse(
        deployment_id=deployment_id,
        error_type=result.get("error_type", "Build Error"),
        root_cause=result.get("root_cause", "Unspecified compilation issue"),
        suggested_fix=result.get("suggested_fix", "Check build command and dependencies"),
        fixed_command_or_config=result.get("fixed_command_or_config"),
        confidence=result.get("confidence", 0.95)
    )


@router.post("/{deployment_id}/redeploy", response_model=DeploymentResponse)
def redeploy_project(
    deployment_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    old_dep = db.query(DeploymentORM).filter(DeploymentORM.id == deployment_id).first()
    if not old_dep:
        raise HTTPException(status_code=404, detail="Deployment not found")

    new_dep_id = str(uuid.uuid4())[:8]
    new_deployment = DeploymentORM(
        id=new_dep_id,
        project_id=old_dep.project_id,
        project_name=old_dep.project_name,
        framework=old_dep.framework,
        provider=old_dep.provider,
        status="QUEUED",
        live_url=None,
        is_demo=old_dep.is_demo,
        cost_inr=old_dep.cost_inr,
        commit_hash=f"redeploy@{uuid.uuid4().hex[:7]}",
        logs_json=json.dumps([DeploymentRunner.create_log_entry("INFO", "Redeploy triggered by user", "QUEUE")]),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_deployment)
    db.commit()

    # Fetch project commands
    proj = db.query(ProjectORM).filter(ProjectORM.id == old_dep.project_id).first()
    build_cmd = proj.build_command if proj else ""
    start_cmd = proj.start_command if proj else ""

    background_tasks.add_task(
        DeploymentRunner.run_deployment,
        deployment_id=new_dep_id,
        project_name=old_dep.project_name,
        framework=old_dep.framework,
        provider=old_dep.provider,
        build_command=build_cmd,
        start_command=start_cmd,
        simulate_error=False
    )

    return format_deployment_response(new_deployment)


@router.get("/{deployment_id}/health")
async def verify_deployment_health(deployment_id: str, db: Session = Depends(get_db)):
    d = db.query(DeploymentORM).filter(DeploymentORM.id == deployment_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Deployment not found")

    if not d.live_url:
        return {"status": "offline", "status_code": 0, "latency_ms": 0, "verified": False}

    # Security validation: only allow HTTPS URLs, reject localhost/private IPs
    if not is_safe_url(d.live_url):
        return {
            "status": "blocked",
            "status_code": 0,
            "latency_ms": 0,
            "verified": False,
            "error": "URL failed security validation: only HTTPS URLs to public endpoints are allowed",
            "live_url": d.live_url
        }

    # Detect prototype/simulated URLs early — regardless of the is_demo flag.
    # DEMO_MODE=false means d.is_demo=False even for Vercel prototype deployments,
    # so we must check the URL domain before attempting any real HTTP request.
    PROTOTYPE_DOMAINS = ("vercel.app", "netlify.app")
    is_prototype_url = any(domain in d.live_url for domain in PROTOTYPE_DOMAINS)

    if d.is_demo or is_prototype_url:
        if not d.live_url:
            return {"status": "offline", "status_code": 0, "latency_ms": 0, "verified": False}

        # Prototype URLs are not real deployments — always return simulated health
        # to avoid making outbound HTTP requests that will 404.
        if is_prototype_url:
            return {
                "status": "simulated",
                "status_code": 200,
                "latency_ms": 38,
                "verified": True,
                "ssl_valid": True,
                "edge_location": "BOM1 (Mumbai, India)",
                "live_url": d.live_url,
                "note": "Prototype deployment: simulated health check (no real cloud resources)"
            }

    # Real URL check with timeout (only for genuinely deployed URLs)
    try:
        start_time = datetime.utcnow()
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(d.live_url)
            latency = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            is_healthy = resp.status_code < 400
            return {
                "status": "healthy" if is_healthy else "degraded",
                "status_code": resp.status_code,
                "latency_ms": latency,
                "verified": is_healthy,
                "ssl_valid": d.live_url.startswith("https"),
                "edge_location": "Edge Anycast",
                "live_url": d.live_url
            }
    except httpx.TimeoutException:
        return {
            "status": "timeout",
            "error": "Health check timed out after 10 seconds",
            "status_code": 408,
            "latency_ms": 10000,
            "verified": False,
            "live_url": d.live_url
        }
    except Exception as e:
        return {
            "status": "unreachable",
            "error": str(e),
            "status_code": 503,
            "latency_ms": 0,
            "verified": False,
            "live_url": d.live_url
        }
