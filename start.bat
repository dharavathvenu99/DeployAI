@echo off
REM DeployAI - Start both frontend and backend servers
REM This script starts the backend API on port 8001 and frontend dev server on port 5173

echo Starting DeployAI...

REM Start Backend API in a new window (uses repo-local venv if present)
start "DeployAI Backend" cmd /k "cd /d %~dp0backend && if exist ..\.venv-backend\Scripts\python.exe (..\.venv-backend\Scripts\python.exe -m uvicorn app.main:app --port 8001 --host 127.0.0.1 --reload) else (python -m uvicorn app.main:app --port 8001 --host 127.0.0.1 --reload)"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend dev server in a new window
start "DeployAI Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo DeployAI servers starting...
echo Backend API:  http://127.0.0.1:8001
echo Frontend:     http://localhost:5173
echo.
echo Press any key to close this window (servers will continue running in separate windows)
pause