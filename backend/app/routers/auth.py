"""
Authentication and Settings Router
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

class UserProfile(BaseModel):
    id: str = "iqoo-dev-001"
    name: str = "iQOO Mobile Developer"
    email: str = "developer@iqoo-phone.internal"
    avatar: str = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
    is_authenticated: bool = True
    github_connected: bool = True
    github_username: str = "iqoo-builder"

class KeyUpdateRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    github_token: Optional[str] = None
    vercel_token: Optional[str] = None
    render_api_key: Optional[str] = None
    railway_api_key: Optional[str] = None
    netlify_auth_token: Optional[str] = None
    demo_mode: Optional[bool] = None

@router.get("/me", response_model=UserProfile)
def get_current_user():
    return UserProfile()

@router.post("/keys")
def update_api_keys(req: KeyUpdateRequest):
    if req.gemini_api_key is not None:
        settings.GEMINI_API_KEY = req.gemini_api_key
    if req.github_token is not None:
        settings.GITHUB_TOKEN = req.github_token
    if req.vercel_token is not None:
        settings.VERCEL_TOKEN = req.vercel_token
    if req.render_api_key is not None:
        settings.RENDER_API_KEY = req.render_api_key
    if req.railway_api_key is not None:
        settings.RAILWAY_API_KEY = req.railway_api_key
    if req.netlify_auth_token is not None:
        settings.NETLIFY_AUTH_TOKEN = req.netlify_auth_token
    if req.demo_mode is not None:
        settings.DEMO_MODE = req.demo_mode
    return {"status": "updated", "demo_mode": settings.DEMO_MODE}

@router.get("/config-status")
def get_config_status():
    return {
        "demo_mode": settings.DEMO_MODE,
        "has_gemini_key": bool(settings.GEMINI_API_KEY),
        "has_github_token": bool(settings.GITHUB_TOKEN),
        "has_vercel_token": bool(settings.VERCEL_TOKEN),
        "has_render_key": bool(settings.RENDER_API_KEY),
        "has_railway_key": bool(settings.RAILWAY_API_KEY),
        "has_netlify_token": bool(settings.NETLIFY_AUTH_TOKEN)
    }