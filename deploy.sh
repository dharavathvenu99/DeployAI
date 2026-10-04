#!/bin/bash
# DeployAI - Automated Deployment Script
# Usage: ./deploy.sh [platform] [environment]
# Platforms: local, render, railway, fly, vercel, netlify
# Environments: development, production

set -e

PLATFORM=${1:-local}
ENV=${2:-production}

echo "🚀 DeployAI Deployment Script"
echo "   Platform: $PLATFORM"
echo "   Environment: $ENV"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

check_env_file() {
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  No .env file found. Creating from example...${NC}"
        cp .env.example .env
        echo -e "${RED}❌ Please edit .env with your actual values before deploying${NC}"
        exit 1
    fi
}

deploy_local() {
    echo -e "${BLUE}📦 Starting local production stack with Docker Compose...${NC}"
    
    check_env_file
    
    echo "Building and starting containers..."
    docker-compose up --build -d
    
    echo "Waiting for services to be healthy..."
    sleep 10
    
    # Health checks
    echo "Checking backend health..."
    for i in {1..30}; do
        if curl -sf http://localhost:8001/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is healthy${NC}"
            break
        fi
        sleep 2
    done
    
    echo "Checking frontend..."
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend may still be starting${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Local deployment complete!${NC}"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8001"
    echo "   API Docs: http://localhost:8001/api/docs"
    echo "   Health Check: http://localhost:8001/api/health"
    echo ""
    echo "Run verification: python verify_deployment.py --frontend-url http://localhost:3000 --backend-url http://localhost:8001"
}

deploy_render() {
    echo -e "${BLUE}☁️  Deploying to Render...${NC}"
    echo ""
    echo "Render deployment requires manual steps via dashboard:"
    echo ""
    echo "1. Create PostgreSQL Database:"
    echo "   https://dashboard.render.com/new/database"
    echo "   - Name: deployai-db"
    echo "   - Database: deployai"
    echo "   - User: deployai"
    echo "   - Copy Internal Database URL"
    echo ""
    echo "2. Create Web Service:"
    echo "   https://dashboard.render.com/new/web-service"
    echo "   - Connect your GitHub repo"
    echo "   - Build Command: pip install -r backend/requirements.txt"
    echo "   - Start Command: uvicorn backend.app.main:app --host 0.0.0.0 --port \$PORT --workers 1"
    echo "   - Add Environment Variables (see ENVIRONMENT_VARIABLES.md)"
    echo ""
    echo "3. After backend deploys, note the URL (e.g., https://deployai-backend.onrender.com)"
    echo ""
    echo "4. Deploy Frontend to Vercel/Netlify with VITE_API_URL set to your backend URL"
}

deploy_railway() {
    echo -e "${BLUE}🚂 Deploying to Railway...${NC}"
    echo ""
    echo "1. Go to https://railway.app/new"
    echo "2. New Project → Add PostgreSQL"
    echo "3. New Service → GitHub Repo"
    echo "4. Select Dockerfile as builder"
    echo "5. Add Environment Variables (see ENVIRONMENT_VARIABLES.md)"
    echo "6. Railway auto-detects PORT"
}

deploy_fly() {
    echo -e "${BLUE}🪰 Deploying to Fly.io...${NC}"
    echo ""
    if ! command -v flyctl &> /dev/null; then
        echo "Installing flyctl..."
        curl -L https://fly.io/install.sh | sh
        export PATH="$HOME/.fly/bin:$PATH"
    fi
    
    echo "Launching app..."
    flyctl launch --dockerfile Dockerfile --no-deploy
    
    echo "Setting secrets..."
    flyctl secrets set \
        DEMO_MODE=false \
        GEMINI_API_KEY="${GEMINI_API_KEY}" \
        GITHUB_TOKEN="${GITHUB_TOKEN}" \
        NETLIFY_AUTH_TOKEN="${NETLIFY_AUTH_TOKEN}" \
        FRONTEND_URL="${FRONTEND_URL}"
    
    echo "Creating volume for uploads..."
    flyctl volumes create deployai_uploads --size 1 || true
    
    echo "Deploying..."
    flyctl deploy
}

deploy_vercel() {
    echo -e "${BLUE}▲ Deploying Frontend to Vercel...${NC}"
    echo ""
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm i -g vercel
    fi
    
    cd frontend
    echo "Deploying to Vercel..."
    vercel --prod
    cd ..
    echo ""
    echo "After deployment, go to Vercel Dashboard → Settings → Environment Variables"
    echo "Add: vite_api_url = https://your-backend-url"
    echo "Then redeploy: vercel --prod --force"
}

deploy_netlify() {
    echo -e "${BLUE}🌐 Deploying Frontend to Netlify...${NC}"
    echo ""
    if ! command -v netlify &> /dev/null; then
        echo "Installing Netlify CLI..."
        npm i -g netlify-cli
    fi
    
    cd frontend
    echo "Deploying to Netlify..."
    netlify deploy --prod --dir=dist
    cd ..
    echo ""
    echo "After deployment, go to Netlify Dashboard → Site Settings → Environment Variables"
    echo "Add: VITE_API_URL = https://your-backend-url"
    echo "Then trigger a new deploy"
}

verify_deployment() {
    FRONTEND_URL=${1:-http://localhost:3000}
    BACKEND_URL=${2:-http://localhost:8001}
    
    echo -e "${BLUE}🔍 Verifying deployment...${NC}"
    python verify_deployment.py --frontend-url "$FRONTEND_URL" --backend-url "$BACKEND_URL"
}

# Main
case $PLATFORM in
    local)
        deploy_local
        ;;
    render)
        deploy_render
        ;;
    railway)
        deploy_railway
        ;;
    fly)
        deploy_fly
        ;;
    vercel)
        deploy_vercel
        ;;
    netlify)
        deploy_netlify
        ;;
    verify)
        verify_deployment "$2" "$3"
        ;;
    *)
        echo "Usage: $0 [local|render|railway|fly|vercel|netlify|verify] [frontend-url] [backend-url]"
        echo ""
        echo "Examples:"
        echo "  $0 local                    # Full local stack with Docker"
        echo "  $0 render                   # Instructions for Render deployment"
        echo "  $0 vercel                   # Deploy frontend to Vercel"
        echo "  $0 netlify                  # Deploy frontend to Netlify"
        echo "  $0 verify http://localhost:3000 http://localhost:8001"
        exit 1
        ;;
esac