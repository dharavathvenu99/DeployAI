"""
Provider Recommendations Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import ProjectORM, ProviderOption
from ..services.provider_engine import ProviderEngine

router = APIRouter(prefix="/providers", tags=["providers"])

@router.get("/recommendations/{project_id}", response_model=List[ProviderOption])
def get_recommendations_for_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(ProjectORM).filter(ProjectORM.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    has_db = project.database_type != "None" and bool(project.database_type)
    return ProviderEngine.get_provider_recommendations(
        framework=project.framework,
        language=project.language,
        has_database=has_db
    )
