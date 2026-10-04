# DeployAI - Production Deployment Guide

## Architecture Overview

DeployAI consists of two separate services:
1. **Frontend** (React + Vite) - Deployed to Vercel or Netlify
2. **Backend** (Python FastAPI) - Deployed to Render, Railway, Fly.io, or similar

The frontend communicates with the backend via REST API calls. In production, they are deployed separately.

---

## Prerequisites

- GitHub account
- Vercel account (for frontend)
- Netlify account (for frontend - alternative to Vercel)
- Render/Railway/Fly.io account (for backend)
- PostgreSQL database (Supabase, Render PostgreSQL, Neon, etc.)

---

## Backend Deployment (Required First)

### Option 1: Render (Recommended - Free Tier Available)

1. **Create a PostgreSQL database on Render:**
   - Go to Render Dashboard → New → PostgreSQL
   - Name: `deployai-db`
   - Database: `deployai`
   - User: `deployai`
   - Region: Oregon (or closest to you)
   - Plan: Free

2. **Create a Web Service on Render:**
   - Go to Render Dashboard → New → Web Service
   - Connect your GitHub repository
   - Configuration:
     - Name: `deployai-backend`
     - Runtime: Python 3
     - Build Command: `pip install -r backend/requirements.txt`
     - Start Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT --workers 1`
     - Plan: Free

3. **Set Environment Variables on Render:**
   ```
   DEMO_MODE=false
   DATABASE_URL=<from PostgreSQL connection string>
   GEMINI_API_KEY=<your-gemini-key>
   GITHUB_TOKEN=<your-github-token>
   NETLIFY_AUTH_TOKEN=<your-netlify-token>
   FRONTEND_URL=https://your-frontend.vercel.app,https://your-frontend.netlify.app
   ```

4. **Deploy and note the backend URL** (e.g., `https://deployai-backend.onrender.com`)

### Option 2: Railway

1. Create a new project on Railway
2. Add PostgreSQL database
3. Add service from GitHub repo
4. Set Dockerfile path: `Dockerfile`
5. Set environment variables (same as Render)
6. Deploy

### Option 3: Fly.io

```bash
flyctl launch --dockerfile Dockerfile
flyctl secrets set DEMO_MODE=false GEMINI_API_KEY=xxx GITHUB_TOKEN=xxx NETLIFY_AUTH_TOKEN=xxx
flyctl deploy
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Import Project on Vercel:**
   - Go to Vercel Dashboard → Add New → Project
   - Import your GitHub repository
   - Framework Preset: Vite
   - Root Directory: `frontend`

2. **Configure Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables on Vercel:**
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

4. **Deploy**

5. **Note the frontend URL** (e.g., `https://deployai-frontend.vercel.app`)

### Option 2: Netlify

1. **Import Project on Netlify:**
   - Go to Netlify Dashboard → Add new site → Import an existing project
   - Connect GitHub repository
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Set Environment Variables on Netlify:**
   - Go to Site settings → Environment variables
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

3. **Deploy**

4. **Note the frontend URL** (e.g., `https://deployai-frontend.netlify.app`)

---

## Post-Deployment Configuration

### Update Backend CORS

After both frontend deployments are complete, update the backend `FRONTEND_URL` environment variable:

```
FRONTEND_URL=https://deployai-frontend.vercel.app,https://deployai-frontend.netlify.app
```

Redeploy the backend to apply CORS changes.

### Verify Deployment

1. **Backend Health Check:**
   - Visit: `https://your-backend-url.onrender.com/api/health`
   - Should return: `{"status": "healthy", "demo_mode": false, "database": "connected", ...}`

2. **Frontend Load:**
   - Visit your Vercel/Netlify URL
   - Should load the DeployAI landing page

3. **API Connection Test:**
   - Open browser dev tools → Network tab
   - Click "Try Sample Project" on landing page
   - Verify API calls go to your backend URL (not localhost)

4. **Full Flow Test:**
   - Upload a ZIP file or connect GitHub repo
   - Verify analysis completes
   - Try deploying to Netlify (requires NETLIFY_AUTH_TOKEN)
   - Verify deployment succeeds

---

## Environment Variables Reference

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `DEMO_MODE` | No | `true` for demo/simulation, `false` for real deployments |
| `DATABASE_URL` | Yes* | PostgreSQL connection string (or use DB_* parts) |
| `DB_HOST` | No* | PostgreSQL host (alternative to DATABASE_URL) |
| `DB_PORT` | No | PostgreSQL port (default: 5432) |
| `DB_NAME` | No | Database name |
| `DB_USER` | No | Database user |
| `DB_PASSWORD` | No | Database password |
| `GEMINI_API_KEY` | No | Google Gemini API key for AI analysis |
| `GITHUB_TOKEN` | No | GitHub PAT for private repo access |
| `NETLIFY_AUTH_TOKEN` | No | Netlify Personal Access Token for real deployments |
| `VERCEL_TOKEN` | No | Vercel token (for future use) |
| `RENDER_API_KEY` | No | Render API key (for future use) |
| `RAILWAY_API_KEY` | No | Railway API key (for future use) |
| `FRONTEND_URL` | Yes* | Comma-separated production frontend URLs for CORS |

*Required for production deployment

### Frontend (.env.production)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Full URL of deployed backend (e.g., `https://deployai-backend.onrender.com`) |

---

## Troubleshooting

### "Failed to fetch" / Network Errors

**Cause:** Frontend cannot reach backend API
**Fix:**
1. Verify `VITE_API_URL` is set correctly in Vercel/Netlify
2. Check backend is running: `curl https://your-backend/api/health`
3. Verify CORS: Backend `FRONTEND_URL` includes your frontend domain
4. Check browser console for exact error

### CORS Errors

**Cause:** Backend blocking frontend origin
**Fix:**
1. Add frontend URL to `FRONTEND_URL` in backend environment
2. Redeploy backend
3. Verify `ALLOWED_ORIGINS` in backend logs on startup

### Database Connection Failed

**Cause:** PostgreSQL connection issues
**Fix:**
1. Verify `DATABASE_URL` format: `postgresql://user:pass@host:5432/db?sslmode=require`
2. For Supabase: Use pooler URL with `?sslmode=require`
3. Check database allows connections from your backend host
4. Verify database exists and user has permissions

### Build Failures on Vercel/Netlify

**Cause:** Missing dependencies or build errors
**Fix:**
1. Check build logs for specific errors
2. Ensure `package-lock.json` is committed
3. Verify Node.js version (use 20.x)
4. Clear build cache and retry

### Deployment Stuck on "Building"

**Cause:** Build command hanging or memory issues
**Fix:**
1. Check build logs for `NODE_OPTIONS='--max-old-space-size=4096'`
2. For large projects, increase build memory
3. Verify `vite build` works locally

---

## Local Development

```bash
# Terminal 1: Start Backend
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your keys
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2: Start Frontend
cd frontend
npm install
cp .env.example .env
# Edit .env with VITE_API_URL=http://127.0.0.1:8001
npm run dev
```

Frontend: http://localhost:5173
Backend API: http://localhost:8001/api/docs

---

## Production Checklist

- [ ] Backend deployed and accessible via HTTPS
- [ ] Backend `/api/health` returns healthy status
- [ ] Database connected and migrations work
- [ ] Frontend deployed to Vercel
- [ ] Frontend deployed to Netlify
- [ ] `VITE_API_URL` set on both Vercel and Netlify
- [ ] `FRONTEND_URL` set on backend with both frontend URLs
- [ ] Backend redeployed after CORS update
- [ ] Full user flow tested on both frontends
- [ ] Netlify deployments work (requires NETLIFY_AUTH_TOKEN)
- [ ] Error handling works (try simulate_error=true)
- [ ] Health checks pass
- [ ] No console errors in browser
- [ ] No network errors in browser dev tools

---

## Support

For issues:
1. Check backend logs on Render/Railway/Fly.io
2. Check frontend build logs on Vercel/Netlify
3. Check browser console and network tab
4. Verify all environment variables are set correctly