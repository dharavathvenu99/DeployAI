# ===========================================
# DEPLOYAI - ENVIRONMENT VARIABLES REFERENCE
# ===========================================
# Copy the section for your target platform and fill in values

# ---------------------------------------------------------
# BACKEND (Render / Railway / Fly.io / Docker / VPS)
# ---------------------------------------------------------

# REQUIRED - Core Configuration
DEMO_MODE=false                          # Set to 'true' for demo/simulation without cloud credentials
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
# OR use individual parts (avoids @ in password issues):
# DB_HOST=your-db-host
# DB_PORT=5432
# DB_NAME=deployai
# DB_USER=deployai
# DB_PASSWORD=your-secure-password

# REQUIRED - Frontend URL for CORS (comma-separated, no spaces)
# Must include ALL frontend URLs where the app is deployed
# Example: FRONTEND_URL=https://your-app.vercel.app,https://your-app.netlify.app
FRONTEND_URL=https://your-app.vercel.app,https://your-app.netlify.app

# OPTIONAL - AI & Integrations (enable real features)
GEMINI_API_KEY=your-google-gemini-api-key          # For AI project analysis & error diagnosis
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx              # For private repo access & higher rate limits
NETLIFY_AUTH_TOKEN=nfp_xxxxxxxxxxxxxxxxxxxx        # For REAL Netlify deployments (not demo)
VERCEL_TOKEN=                                      # Reserved for future Vercel provider
RENDER_API_KEY=                                    # Reserved for future Render provider
RAILWAY_API_KEY=                                   # Reserved for future Railway provider

# OPTIONAL - Advanced
# LOG_LEVEL=INFO
# JWT_SECRET=your-jwt-secret-for-auth


# ---------------------------------------------------------
# FRONTEND - VERCEL
# ---------------------------------------------------------
# Go to: Vercel Dashboard → Project → Settings → Environment Variables
# Add these as "Production" environment variables:

# REQUIRED - Backend API URL (must include protocol, no trailing slash)
# This is the FULL URL of your deployed backend (Render, Railway, Fly.io, etc.)
VITE_API_URL=https://your-backend.onrender.com
# OR if using custom domain:
# VITE_API_URL=https://api.yourdomain.com

# Optional:
# VITE_GA_ID=G-XXXXXXXXXX


# ---------------------------------------------------------
# FRONTEND - NETLIFY
# ---------------------------------------------------------
# Go to: Netlify Dashboard → Site → Site Settings → Environment Variables

# REQUIRED - Backend API URL (must include protocol, no trailing slash)
VITE_API_URL=https://your-backend.onrender.com
# OR if using custom domain:
# VITE_API_URL=https://api.yourdomain.com

# Optional:
# VITE_GA_ID=G-XXXXXXXXXX


# ---------------------------------------------------------
# FRONTEND - RAILWAY (if hosting frontend on Railway)
# ---------------------------------------------------------
# Go to: Railway Dashboard → Project → Variables

VITE_API_URL=https://your-backend.onrender.com


# ---------------------------------------------------------
# DOCKER COMPOSE (Local Production Testing)
# ---------------------------------------------------------
# Create .env file in project root with:

# DEMO_MODE=false
# DATABASE_URL=postgresql://deployai:deployai_secure_pass_2024@postgres:5432/deployai?sslmode=disable
# FRONTEND_URL=http://localhost:3000,http://localhost:5173
# GEMINI_API_KEY=your-key-here
# GITHUB_TOKEN=your-token-here
# NETLIFY_AUTH_TOKEN=your-token-here


# ---------------------------------------------------------
# RENDER.COM (Backend + PostgreSQL)
# ---------------------------------------------------------
# 1. Create PostgreSQL: Dashboard → New → PostgreSQL
#    - Name: deployai-db
#    - Database: deployai
#    - User: deployai
#    - Region: Oregon (or closest)
#    - Copy "Internal Database URL" → use as DATABASE_URL

# 2. Create Web Service: Dashboard → New → Web Service
#    - Connect GitHub repo
#    - Build Command: pip install -r backend/requirements.txt
#    - Start Command: uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT --workers 1
#    - Environment Variables (copy from BACKEND section above)
#    - Add DATABASE_URL from PostgreSQL connection string


# ---------------------------------------------------------
# RAILWAY.APP (Backend + PostgreSQL)
# ---------------------------------------------------------
# 1. New Project → Add PostgreSQL
# 2. New Service → GitHub Repo → Dockerfile
# 3. Variables: Copy from BACKEND section
# 4. Set PORT=8001 (Railway provides $PORT automatically)


# ---------------------------------------------------------
# FLY.IO (Backend + Volume)
# ---------------------------------------------------------
# flyctl launch --dockerfile Dockerfile
# flyctl secrets set DEMO_MODE=false GEMINI_API_KEY=xxx GITHUB_TOKEN=xxx NETLIFY_AUTH_TOKEN=xxx FRONTEND_URL=xxx
# flyctl volumes create deployai_uploads --size 1
# flyctl deploy


# ---------------------------------------------------------
# GETTING API KEYS
# ---------------------------------------------------------

# GEMINI_API_KEY:
#   https://makersuite.google.com/app/apikey
#   Create API Key → Copy

# GITHUB_TOKEN:
#   GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained
#   Repo access: Select repositories
#   Permissions: Contents (Read), Metadata (Read)

# NETLIFY_AUTH_TOKEN:
#   Netlify → User Settings → Applications → Personal Access Tokens
#   New Token → Name: DeployAI → Copy token

# VERCEL_TOKEN:
#   Vercel → Settings → Tokens → Create
#   (Not currently used - Vercel provider is prototype only)


# ---------------------------------------------------------
# QUICK TEST COMMANDS
# ---------------------------------------------------------

# Local with Docker Compose:
#   docker-compose up --build

# Verify deployment:
#   python verify_deployment.py --frontend-url http://localhost:3000 --backend-url http://localhost:8001

# Backend only:
#   cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Frontend only (dev):
#   cd frontend && npm run dev -- --host

# Build frontend for production:
#   cd frontend && npm run build


# ---------------------------------------------------------
# CRITICAL NOTES FOR PRODUCTION DEPLOYMENT
# ---------------------------------------------------------

# 1. VITE_API_URL MUST be set in production
#    - Frontend (Vercel/Netlify/Railway) needs to know where the backend is
#    - Without it, API calls will fail with "Cannot connect to API"
#    - Set it in your deployment platform's environment variables UI

# 2. FRONTEND_URL MUST be set in backend
#    - Backend needs to know allowed origins for CORS
#    - Include ALL frontend URLs (Vercel, Netlify, custom domains)
#    - Comma-separated, no spaces

# 3. CORS Configuration
#    - In production (DEMO_MODE=false), only FRONTEND_URL origins are allowed
#    - In demo mode (DEMO_MODE=true), all origins are allowed for development

# 4. Database
#    - Use managed PostgreSQL (Render, Railway, Supabase, Neon)
#    - Ensure SSL mode is required (sslmode=require)
#    - Run migrations on startup (handled automatically)

# 5. Backend URL Format
#    - Must include protocol (https://)
#    - No trailing slash
#    - Example: https://deployai-backend.onrender.com
#    - The /api path is added automatically by frontend