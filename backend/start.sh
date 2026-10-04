#!/bin/bash
# DeployAI Backend Production Startup Script

set -e

echo "🚀 Starting DeployAI Backend..."

# Validate required environment variables
if [ "$DEMO_MODE" = "false" ]; then
    if [ -z "$DATABASE_URL" ] && [ -z "$DB_HOST" ]; then
        echo "❌ ERROR: DATABASE_URL or DB_HOST must be set when DEMO_MODE=false"
        exit 1
    fi
    
    if [ -z "$FRONTEND_URL" ]; then
        echo "⚠️  WARNING: FRONTEND_URL not set. CORS may not work for production frontend."
    fi
fi

# Run from backend/ dir, so the module is app.main (not backend.app.main)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Run database migrations
echo "📦 Initializing database..."
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

# Start the application
echo "🌐 Starting server on port ${PORT:-8001}..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001} --workers 1