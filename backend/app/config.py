"""
Backend configuration for DeployAI
"""
import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "DeployAI - Intelligent Auto Deployment Platform"
    API_V1_STR: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    VERCEL_TOKEN: str = os.getenv("VERCEL_TOKEN", "")
    RENDER_API_KEY: str = os.getenv("RENDER_API_KEY", "")
    RAILWAY_API_KEY: str = os.getenv("RAILWAY_API_KEY", "")
    NETLIFY_AUTH_TOKEN: str = os.getenv("NETLIFY_AUTH_TOKEN", "")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./deployai.db")
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    SAMPLES_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_projects")
    
    # Frontend URL for CORS (comma-separated list)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://deployai-2.onrender.com")
    # Backend public URL — used to build real executable live URLs (/live/<id>)
    BACKEND_URL: str = os.getenv("BACKEND_URL", os.getenv("RENDER_EXTERNAL_URL", "https://deployai-1-zx6q.onrender.com"))
    # Directory where built live sites are published (served at /live/<deployment_id>/)
    LIVE_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "live")

    PRODUCTION_FRONTENDS: tuple = (
        "https://deployai-2.onrender.com",
    )
    PRODUCTION_BACKENDS: tuple = (
        "https://deployai-1-zx6q.onrender.com",
    )

    @property
    def LIVE_BASE_URL(self) -> str:
        base = (self.BACKEND_URL or "").strip().rstrip("/")
        if base:
            return base
        return "https://deployai-1-zx6q.onrender.com"

    @property
    def ALLOWED_ORIGINS(self) -> list[str]:
        origins = [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8001",
        ]
        # Always allow the production frontend/backend so Render deploys work
        # even when FRONTEND_URL env var is missing on the platform.
        for url in list(self.PRODUCTION_FRONTENDS) + list(self.PRODUCTION_BACKENDS):
            origins.append(url)
        # Add configured frontend URL(s) if provided
        if self.FRONTEND_URL:
            for url in self.FRONTEND_URL.split(","):
                url = url.strip().rstrip("/")
                if url:
                    origins.append(url)
        # Also allow backend URL explicitly
        if self.BACKEND_URL:
            origins.append(self.BACKEND_URL.strip().rstrip("/"))
        # Deduplicate while preserving order
        return list(dict.fromkeys(o for o in origins if o))
    
    @property
    def CORS_ALLOW_CREDENTIALS(self) -> bool:
        """Allow credentials only in production with specific origins, not with wildcard."""
        return not self.DEMO_MODE and self.FRONTEND_URL != ""

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.SAMPLES_DIR, exist_ok=True)
os.makedirs(settings.LIVE_DIR, exist_ok=True)