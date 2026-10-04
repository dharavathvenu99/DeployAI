@echo off
REM DeployAI Backend Production Startup Script (Windows)

echo 🚀 Starting DeployAI Backend...

REM Validate required environment variables
if "%DEMO_MODE%"=="false" (
    if "%DATABASE_URL%"=="" (
        if "%DB_HOST%"=="" (
            echo ❌ ERROR: DATABASE_URL or DB_HOST must be set when DEMO_MODE=false
            exit /b 1
        )
    )
    
    if "%FRONTEND_URL%"=="" (
        echo ⚠️  WARNING: FRONTEND_URL not set. CORS may not work for production frontend.
    )
)

REM Run database migrations (runs from backend/ dir, so module is app.main)
echo 📦 Initializing database...
python -c "
from app.database import engine
from app.models import Base
try:
    Base.metadata.create_all(bind=engine)
    print('✅ Database tables created/verified')
except Exception as e:
    print(f'❌ Database initialization failed: {e}')
    exit(1)
"

REM Start the application
echo 🌐 Starting server on port %PORT%...
uvicorn app.main:app --host 0.0.0.0 --port %PORT% --workers 1