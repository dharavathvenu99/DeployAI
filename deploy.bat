@echo off
REM DeployAI - Automated Deployment Script (Windows)
REM Usage: deploy.bat [platform] [environment]
REM Platforms: local, render, railway, fly, vercel, netlify
REM Environments: development, production

set PLATFORM=%~1
set ENV=%~2

if "%PLATFORM%"=="" set PLATFORM=local
if "%ENV%"=="" set ENV=production

echo 🚀 DeployAI Deployment Script
echo    Platform: %PLATFORM%
echo    Environment: %ENV%
echo.

if "%PLATFORM%"=="local" (
    call :deploy_local
) else if "%PLATFORM%"=="render" (
    call :deploy_render
) else if "%PLATFORM%"=="railway" (
    call :deploy_railway
) else if "%PLATFORM%"=="fly" (
    call :deploy_fly
) else if "%PLATFORM%"=="vercel" (
    call :deploy_vercel
) else if "%PLATFORM%"=="netlify" (
    call :deploy_netlify
) else if "%PLATFORM%"=="verify" (
    call :verify_deployment %3 %4
) else (
    echo Usage: deploy.bat [local^|render^|railway^|fly^|vercel^|netlify^|verify] [frontend-url] [backend-url]
    echo.
    echo Examples:
    echo   deploy.bat local                    ^< Full local stack with Docker
    echo   deploy.bat render                   ^< Instructions for Render deployment
    echo   deploy.bat vercel                   ^< Deploy frontend to Vercel
    echo   deploy.bat netlify                  ^< Deploy frontend to Netlify
    echo   deploy.bat verify http://localhost:3000 http://localhost:8001
    exit /b 1
)

goto :eof

:deploy_local
echo 📦 Starting local production stack with Docker Compose...
echo.

if not exist ".env" (
    echo ⚠️  No .env file found. Creating from example...
    copy .env.example .env
    echo ❌ Please edit .env with your actual values before deploying
    exit /b 1
)

echo Building and starting containers...
docker-compose up --build -d

echo Waiting for services to be healthy...
timeout /t 10 >nul

echo Checking backend health...
for /l %%i in (1,1,30) do (
    curl -sf http://localhost:8001/api/health >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Backend is healthy
        goto :frontend_check
    )
    timeout /t 2 >nul
)
echo ⚠️  Backend health check timeout

:frontend_check
echo Checking frontend...
curl -sf http://localhost:3000 >nul 2>&1
if not errorlevel 1 (
    echo ✅ Frontend is accessible
) else (
    echo ⚠️  Frontend may still be starting
)

echo.
echo 🎉 Local deployment complete!
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8001
echo    API Docs: http://localhost:8001/api/docs
echo    Health Check: http://localhost:8001/api/health
echo.
echo Run verification: python verify_deployment.py --frontend-url http://localhost:3000 --backend-url http://localhost:8001
goto :eof

:deploy_render
echo ☁️  Deploying to Render...
echo.
echo Render deployment requires manual steps via dashboard:
echo.
echo 1. Create PostgreSQL Database:
echo    https://dashboard.render.com/new/database
echo    - Name: deployai-db
echo    - Database: deployai
echo    - User: deployai
echo    - Copy Internal Database URL
echo.
echo 2. Create Web Service:
echo    https://dashboard.render.com/new/web-service
echo    - Connect your GitHub repo
echo    - Build Command: pip install -r backend/requirements.txt
echo    - Start Command: uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT --workers 1
echo    - Add Environment Variables (see ENVIRONMENT_VARIABLES.md)
echo.
echo 3. After backend deploys, note the URL (e.g., https://deployai-backend.onrender.com)
echo.
echo 4. Deploy Frontend to Vercel/Netlify with VITE_API_URL set to your backend URL
goto :eof

:deploy_railway
echo 🚂 Deploying to Railway...
echo.
echo 1. Go to https://railway.app/new
echo 2. New Project -> Add PostgreSQL
echo 3. New Service -> GitHub Repo
echo 4. Select Dockerfile as builder
echo 5. Add Environment Variables (see ENVIRONMENT_VARIABLES.md)
echo 6. Railway auto-detects PORT
goto :eof

:deploy_fly
echo 🪰 Deploying to Fly.io...
echo.
if not exist "%USERPROFILE%\.fly\bin\flyctl.exe" (
    echo Installing flyctl...
    powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
)
set PATH=%PATH%;%USERPROFILE%\.fly\bin

echo Launching app...
flyctl launch --dockerfile Dockerfile --no-deploy

echo Setting secrets...
flyctl secrets set DEMO_MODE=false GEMINI_API_KEY=%GEMINI_API_KEY% GITHUB_TOKEN=%GITHUB_TOKEN% NETLIFY_AUTH_TOKEN=%NETLIFY_AUTH_TOKEN% FRONTEND_URL=%FRONTEND_URL%

echo Creating volume for uploads...
flyctl volumes create deployai_uploads --size 1

echo Deploying...
flyctl deploy
goto :eof

:deploy_vercel
echo ▲ Deploying Frontend to Vercel...
echo.
cd frontend
if not exist "node_modules\.bin\vercel.cmd" (
    echo Installing Vercel CLI...
    npm i -g vercel
)
vercel --prod
cd ..
echo.
echo After deployment, go to Vercel Dashboard -> Settings -> Environment Variables
echo Add: vite_api_url = https://your-backend-url
echo Then redeploy: vercel --prod --force
goto :eof

:deploy_netlify
echo 🌐 Deploying Frontend to Netlify...
echo.
cd frontend
if not exist "node_modules\.bin\netlify.cmd" (
    echo Installing Netlify CLI...
    npm i -g netlify-cli
)
netlify deploy --prod --dir=dist
cd ..
echo.
echo After deployment, go to Netlify Dashboard -> Site Settings -> Environment Variables
echo Add: VITE_API_URL = https://your-backend-url
echo Then trigger a new deploy
goto :eof

:verify_deployment
if "%~3"=="" (
    set FRONTEND_URL=http://localhost:3000
    set BACKEND_URL=http://localhost:8001
) else (
    set FRONTEND_URL=%~3
    set BACKEND_URL=%~4
)

echo 🔍 Verifying deployment...
python verify_deployment.py --frontend-url %FRONTEND_URL% --backend-url %BACKEND_URL%
goto :eof