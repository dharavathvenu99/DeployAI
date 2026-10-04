"""
DeployAI — Main FastAPI Application Entrypoint
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .config import settings
from .database import engine, Base, check_database_health
from .routers import auth, analyzer, providers, deployments, samples
from .services.samples_manager import SamplesManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables with retry logic
    logger.info("Initializing database tables...")
    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables initialized successfully")
            break
        except Exception as e:
            logger.warning(f"Database table creation attempt {attempt}/{max_retries} failed: {e}")
            if attempt == max_retries:
                logger.error(f"Failed to initialize database tables after {max_retries} attempts: {e}")
            else:
                import time
                time.sleep(2 ** (attempt - 1))

    # Pre-bundle hackathon sample projects
    SamplesManager.ensure_sample_projects()

    # Log startup configuration
    logger.info("[DeployAI] Backend starting...")
    logger.info(f"[DeployAI] Demo Mode: {settings.DEMO_MODE}")
    logger.info(f"[DeployAI] CORS Origins: {settings.ALLOWED_ORIGINS}")
    logger.info(f"[DeployAI] Database: {check_database_health().get('status', 'unknown')}")

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Auto Deployment Platform with AI Analysis, Multi-Provider Scoring & Live Deployment Engine",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(analyzer.router, prefix=settings.API_V1_STR)
app.include_router(providers.router, prefix=settings.API_V1_STR)
app.include_router(deployments.router, prefix=settings.API_V1_STR)
app.include_router(samples.router, prefix=settings.API_V1_STR)


@app.get("/api/health")
def health():
    db_health = check_database_health()
    return {
        "status": "healthy" if db_health["status"] == "connected" else "degraded",
        "demo_mode": settings.DEMO_MODE,
        "database": db_health["status"],
        "storage": "uploads_ready",
        "version": "1.0.0"
    }


# Check if frontend production build exists
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")

if os.path.exists(FRONTEND_DIST) and os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
    # Mount assets folder
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Serve index.html or static files
    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        # Disallow API paths falling through
        if full_path.startswith("api/"):
            return {"error": "API route not found"}
        target = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.exists(target) and os.path.isfile(target):
            return FileResponse(target)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "service": "DeployAI Backend API",
            "status": "operational",
            "demo_mode": settings.DEMO_MODE,
            "docs": "/api/docs"
        }
