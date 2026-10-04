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


# Serve REAL deployed projects at /live/<deployment_id>/ (DeployAI Cloud).
# Each successful DeployAI Cloud deployment publishes its built static output to
# uploads/live/<deployment_id>/ — these URLs are public and execute in a browser.
LIVE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "live")
os.makedirs(LIVE_DIR, exist_ok=True)


@app.get("/live/{deployment_id}", include_in_schema=False)
def serve_live_root(deployment_id: str):
    index = os.path.join(LIVE_DIR, deployment_id, "index.html")
    if os.path.exists(index):
        return FileResponse(index)
    return {"error": "Live deployment not found", "deployment_id": deployment_id}


@app.get("/live/{deployment_id}/{file_path:path}", include_in_schema=False)
def serve_live_files(deployment_id: str, file_path: str):
    base = os.path.join(LIVE_DIR, deployment_id)
    target = os.path.normpath(os.path.join(base, file_path))
    # Block path traversal outside the deployment slot
    if os.path.commonpath([base, target]) != base:
        return {"error": "Invalid path"}
    if os.path.isfile(target):
        return FileResponse(target)
    # SPA fallback so client-side routes execute instead of 404
    index = os.path.join(base, "index.html")
    if os.path.exists(index):
        return FileResponse(index)
    return {"error": "Live deployment not found", "deployment_id": deployment_id}


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
