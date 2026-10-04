"""
Data models for DeployAI (SQLAlchemy ORM + Pydantic schemas)
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, Float
from pydantic import BaseModel, Field
from .database import Base

# ================= SQLAlchemy ORM Models =================

class ProjectORM(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, default="")
    source_type = Column(String, default="zip")  # "zip", "github", "sample"
    github_url = Column(String, nullable=True)
    repo_branch = Column(String, default="main")
    framework = Column(String, default="Unknown")
    language = Column(String, default="Unknown")
    build_command = Column(String, default="")
    start_command = Column(String, default="")
    output_dir = Column(String, default="dist")
    port = Column(Integer, default=3000)
    env_vars_json = Column(Text, default="{}")
    database_type = Column(String, default="None")
    created_at = Column(DateTime, default=datetime.utcnow)


class DeploymentORM(Base):
    __tablename__ = "deployments"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, index=True)
    project_name = Column(String)
    framework = Column(String)
    provider = Column(String)  # vercel, render, railway, netlify, fly
    status = Column(String, default="QUEUED")  # QUEUED, BUILDING, DEPLOYING, HEALTH_CHECK, SUCCESS, FAILED
    live_url = Column(String, nullable=True)
    is_demo = Column(Boolean, default=True)
    cost_inr = Column(Float, default=0.0)
    commit_hash = Column(String, default="main@head")
    logs_json = Column(Text, default="[]")
    error_message = Column(Text, nullable=True)
    ai_diagnosis = Column(Text, nullable=True)
    ai_fix_suggestion = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


# ================= Pydantic Schemas =================

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    source_type: str = "zip"
    github_url: Optional[str] = None
    repo_branch: Optional[str] = "main"

class ProjectUpdate(BaseModel):
    build_command: Optional[str] = None
    start_command: Optional[str] = None
    output_dir: Optional[str] = None
    port: Optional[int] = None
    env_vars: Optional[Dict[str, str]] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    source_type: str
    github_url: Optional[str]
    repo_branch: str
    framework: str
    language: str
    build_command: str
    start_command: str
    output_dir: str
    port: int
    env_vars: Dict[str, str] = {}
    database_type: str
    created_at: datetime

    class Config:
        from_attributes = True

class FileNode(BaseModel):
    name: str
    path: str
    type: str  # "file" or "folder"
    size: Optional[int] = 0
    children: Optional[List["FileNode"]] = None

class AnalysisResponse(BaseModel):
    project_id: str
    name: str
    framework: str
    language: str
    package_manager: str
    build_command: str
    start_command: str
    output_dir: str
    port: int
    database_detected: str
    env_variables_detected: List[str]
    dependencies: List[str]
    confidence_score: float
    ai_summary: str
    ai_recommendations: List[str]
    file_tree: List[FileNode]
    total_files: int
    is_ai_powered: bool

class ProviderTier(BaseModel):
    tier_name: str
    cost_usd_month: float
    cost_inr_month: float
    bandwidth_gb: str
    build_minutes: str
    features: List[str]

class ProviderOption(BaseModel):
    id: str  # vercel, netlify, render, railway, fly
    name: str
    logo: str
    category: str  # Frontend CDN, Fullstack Container, Backend PaaS
    compatibility_score: int  # 0-100
    is_recommended: bool
    free_tier_available: bool
    estimated_cost_inr_month: float
    pros: List[str]
    cons: List[str]
    recommended_reason: str
    tiers: List[ProviderTier]
    deploy_badge: str

class DeploymentRequest(BaseModel):
    project_id: str
    provider: str
    tier_name: str = "Free Tier"
    approve_payment: bool = False
    custom_domain: Optional[str] = None
    env_overrides: Optional[Dict[str, str]] = None
    simulate_error: bool = False

class LogEntry(BaseModel):
    timestamp: str
    level: str  # INFO, BUILD, WARN, ERROR, SUCCESS
    message: str
    stage: str

class DeploymentResponse(BaseModel):
    id: str
    project_id: str
    project_name: str
    framework: str
    provider: str
    status: str
    live_url: Optional[str]
    is_demo: bool
    cost_inr: float
    commit_hash: str
    logs: List[LogEntry]
    error_message: Optional[str]
    ai_diagnosis: Optional[str]
    ai_fix_suggestion: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ErrorDiagnosisRequest(BaseModel):
    deployment_id: str
    error_log: str

class ErrorDiagnosisResponse(BaseModel):
    deployment_id: str
    error_type: str
    root_cause: str
    suggested_fix: str
    fixed_command_or_config: Optional[str]
    confidence: float
