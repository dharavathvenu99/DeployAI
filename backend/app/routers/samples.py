"""
Samples Router: List and 1-Click Load Pre-bundled Hackathon Projects
"""
import os
import uuid
import shutil
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ProjectORM, AnalysisResponse
from ..services.samples_manager import SamplesManager
from ..services.inspector import ProjectInspector
from ..services.ai_analyzer import AIAnalyzerService
from ..config import settings

router = APIRouter(prefix="/samples", tags=["samples"])

@router.get("/list")
def list_samples():
    SamplesManager.ensure_sample_projects()
    return SamplesManager.get_sample_list()

@router.post("/load/{sample_id}", response_model=AnalysisResponse)
async def load_sample_project(sample_id: str, db: Session = Depends(get_db)):
    SamplesManager.ensure_sample_projects()
    sample_source_dir = os.path.join(settings.SAMPLES_DIR, sample_id)

    if not os.path.exists(sample_source_dir):
        # Fallback to map name
        mapping = {
            "eduai": "eduai",
            "react-ecommerce": "react-ecommerce",
            "nextjs-dashboard": "nextjs-dashboard"
        }
        mapped = mapping.get(sample_id)
        if mapped:
            sample_source_dir = os.path.join(settings.SAMPLES_DIR, mapped)

    if not os.path.exists(sample_source_dir):
        raise HTTPException(status_code=404, detail="Sample project not found")

    project_id = f"demo-{sample_id}-{uuid.uuid4().hex[:4]}"
    project_dir = os.path.join(settings.UPLOAD_DIR, project_id)

    # Copy files into uploads folder
    shutil.copytree(sample_source_dir, project_dir)

    # Inspect
    detected = ProjectInspector.inspect_directory(project_dir)
    file_tree, total_files = ProjectInspector.build_file_tree(project_dir)
    flat_files = [node.path for node in file_tree]

    # Name mapping
    names = {
        "eduai": "EduAI — AI Classroom Assistant",
        "react-ecommerce": "SwiftCart — Modern React Store",
        "nextjs-dashboard": "NextCloud — Analytics Portal"
    }
    project_name = names.get(sample_id, sample_id.title())

    ai_result = await AIAnalyzerService.analyze_project_with_ai(project_name, detected, flat_files)

    project = ProjectORM(
        id=project_id,
        name=project_name,
        description=ai_result.get("summary", ""),
        source_type="sample",
        github_url=None,
        repo_branch="main",
        framework=detected["framework"],
        language=detected["language"],
        build_command=detected["build_command"],
        start_command=detected["start_command"],
        output_dir=detected["output_dir"],
        port=detected["port"],
        env_vars_json=json.dumps({k: "" for k in detected.get("env_variables_detected", [])}),
        database_type=detected["database_detected"]
    )
    db.add(project)
    db.commit()

    return AnalysisResponse(
        project_id=project_id,
        name=project_name,
        framework=detected["framework"],
        language=detected["language"],
        package_manager=detected["package_manager"],
        build_command=detected["build_command"],
        start_command=detected["start_command"],
        output_dir=detected["output_dir"],
        port=detected["port"],
        database_detected=detected["database_detected"],
        env_variables_detected=detected["env_variables_detected"],
        dependencies=detected["dependencies"],
        confidence_score=ai_result.get("confidence_score", 0.98),
        ai_summary=ai_result.get("summary", ""),
        ai_recommendations=ai_result.get("recommendations", []),
        file_tree=file_tree,
        total_files=total_files,
        is_ai_powered=ai_result.get("is_ai_powered", False)
    )

@router.get("/download/{filename}")
def download_sample_zip(filename: str):
    SamplesManager.ensure_sample_projects()
    file_path = os.path.join(settings.SAMPLES_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Sample zip not found")
    return FileResponse(file_path, media_type="application/zip", filename=filename)
