# DeployAI — Intelligent Auto Deployment Platform

> **Mobile-First AI Developer Tool for Instant Multi-Cloud Deployment & Cost Optimization**  
> Built for Hackathon Prototypes • Optimized for iQOO Android Phones & Modern Browsers

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.111-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.11%20%2F%203.13-3776AB.svg?style=flat&logo=python)](https://python.org)
[![PWA](https://img.shields.io/badge/PWA-iQOO%20Android%20Ready-8b5cf6.svg?style=flat)](https://web.dev/progressive-web-apps/)

---

## 🌟 Overview & Key Capabilities

**DeployAI** enables developers and hackathon judges to upload any software project ZIP or connect a GitHub repository directly from their mobile phone or desktop browser. The platform autonomously:

1. **Safely Inspects Codebases:** Extensively validates ZIP contents against path-traversal (Zip-Slip) attacks and scans AST & manifests (`package.json`, `requirements.txt`, `Dockerfile`, `pom.xml`, etc.).
2. **AI-Powered Framework & Dependency Detection:** Identifies React, Next.js, FastAPI, Flask, Node.js, Spring Boot, Docker, SQLite, PostgreSQL, MongoDB, ports, and environment variables using Google Gemini API (with deterministic offline heuristic fallback).
3. **Multi-Provider Comparison Engine:** Analyzes compatibility scores and generates accurate hosting cost breakdowns in **Indian Rupees (INR ₹)** comparing **Vercel**, **Render**, **Railway**, and **Netlify**.
4. **Mandatory User Approval:** Enforces transparent cost approval and a simulated sandbox checkout before any cloud provisioning.
5. **Real-Time Deployment Pipeline:** Streams live ANSI-colored build logs through 5 pipeline stages (Sanitization → Dependencies → Build & Bundle → DNS/SSL → Health Probe).
6. **AI Build Error Diagnosis & 1-Click Fix:** Analyzes failed compilations with Gemini AI, pinpointing the root cause and providing actionable, 1-click redeploy fixes.
7. **Instant Edge Verification & Mobile Testing:** Issues live URLs with one-touch "Open Project", "Copy Link", interactive in-app mobile frame preview, and QR code generator for instant testing on **iQOO Android phones**.

---

## 📱 Mobile-First Design for iQOO Android Phones

DeployAI was designed from the ground up for mobile developers using Android phones such as the **iQOO Neo / Z / 12 series**:

- **Touch Ergonomics:** High touch-target sizes (minimum 48px), responsive bottom navigation dock (`Home`, `Deploy`, `Terminal`, `History`, `Settings`).
- **PWA Installation:** Includes `manifest.json`, theme colors `#070814`, mobile viewport meta tags (`viewport-fit=cover`), and standalone app capability.
- **In-App Mobile Device Simulator:** Judges can interactively preview deployed web applications inside an embedded mobile browser frame without switching apps.
- **Instant QR Code Scanner:** Judges can open their iQOO camera / Google Lens and immediately launch the live deployed link on their phone.
- **Glassmorphism Aesthetic:** Premium dark palette with glowing purple (`#8b5cf6`), neon cyan (`#06b6d4`), and emerald accents with smooth GPU-accelerated transitions.

---

## 🚀 Quick Start & Setup

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ (tested on Node v22)
- npm 9+

### 1. Unified Run (Single Port 8000)
The backend has been configured to serve both the REST API and the pre-built React frontend SPA:

```bash
# In project root
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Open **`http://localhost:8000`** in your browser.

### 2. Development Mode with Hot Reload
If you wish to run frontend and backend with hot reload:

**Terminal 1 — Backend:**
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev -- --host
```
Open **`http://localhost:5173`** on desktop, or navigate to **`http://<your-local-ip>:5173`** on your iQOO phone connected to the same Wi-Fi network!

---

## 🎯 Hackathon Judge Demo Flow (Zero Credentials Needed)

DeployAI includes a **Hackathon Demo Mode** that works 100% out of the box without requiring any API keys or paid cloud accounts.

### Test Path 1: 1-Click EduAI Deployment
1. On the landing page, click **"Try EduAI (1-Click)"** or navigate to the sample cards.
2. DeployAI instantly loads the pre-bundled **EduAI** project (Python FastAPI + SQLite AI classroom app).
3. Review the **AI Project Analysis** view:
   - Framework: `FastAPI (Python 3)` (96% Confidence)
   - Port: `8000`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Detected Env Vars: `PORT`, `DATABASE_URL`, `GEMINI_API_KEY`
4. Click **"Select Provider & Pricing"**:
   - Notice **Render** ranked #1 (98% compatibility, ₹0/mo free tier).
   - Review INR pricing plans and pros/cons.
5. Click **"Approve & Deploy to Render"**:
   - Check the authorization confirmation dialog showing ₹0.00 cost.
   - Click **"Authorize & Deploy"**.
6. Watch the **Real-Time Deployment Terminal** stream build stages.
7. Upon completion:
   - View live URL: `https://eduai-app.deployai.live`.
   - Click **"Interactive Mobile Preview"** to test the quiz engine inside the phone mockup.
   - Click **"Scan QR for iQOO Phone"** to test it on a phone!

### Test Path 2: AI Error Diagnosis & 1-Click Fix
1. Load any project or upload a ZIP.
2. On the **Hosting Provider & Pricing** page, toggle the **"Judge Demo: Simulate Build Failure"** switch ON.
3. Click **"Approve & Deploy"**.
4. The terminal will simulate a missing dependency failure (`ModuleNotFoundError: No module named 'langchain_community'`).
5. Watch the **AI Deployment Error Diagnoser** automatically analyze the log, explain the root cause, and display the exact repair command:
   `pip install langchain-community==0.2.6 && pip freeze > requirements.txt`
6. Click **"Apply AI Fix & Redeploy"** to verify automatic recovery and successful deployment!

---

## 🔒 Security & Safe Sandbox Architecture

- **Zip Slip Defense:** Uploaded zip archives are validated using `os.path.commonpath` to ensure no files write outside the sandboxed extraction target.
- **Zero Untrusted Execution:** Untrusted user code is never directly executed on the main application host server.
- **Credential Protection:** Cloud API tokens (Vercel, Render, Gemini) are stored only in server memory and never leaked to frontend client code.
- **Cost Guardrails:** Transparent approval modal requires explicit user authorization before any paid tier or simulated charges.

---

## 📁 Repository Structure

```
deployAI/
├── backend/
│   ├── app/
│   │   ├── config.py              # Configuration & env management
│   │   ├── database.py            # SQLite / PostgreSQL SQLAlchemy engine
│   │   ├── models.py              # SQLAlchemy ORM & Pydantic models
│   │   ├── main.py                # FastAPI entrypoint & SPA static server
│   │   ├── routers/
│   │   │   ├── auth.py            # Settings & key management
│   │   │   ├── analyzer.py        # ZIP upload, GitHub connect, AST scanner
│   │   │   ├── providers.py       # Provider ranking & INR pricing engine
│   │   │   ├── deployments.py     # Live deployment runner & logs
│   │   │   └── samples.py         # 1-click sample project loader
│   │   └── services/
│   │       ├── inspector.py       # Safe ZIP extractor & framework detector
│   │       ├── ai_analyzer.py     # Google Gemini API & error diagnoser
│   │       ├── provider_engine.py # Multi-cloud comparison matrix
│   │       ├── deployer.py        # Real & demo build streamer
│   │       └── samples_manager.py # Pre-bundled hackathon projects
│   ├── sample_projects/           # EduAI, SwiftCart, NextCloud
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/            # Header, MobileBottomNav, Terminal, QR, Preview
│   │   ├── pages/                 # Landing, Upload, Analysis, Providers, Deploying, Success, History
│   │   ├── services/api.ts        # Client API SDK
│   │   ├── types/index.ts         # TypeScript schema definitions
│   │   ├── App.tsx                # State coordinator & responsive router
│   │   └── index.css              # Tailwind v4 glassmorphism styles
│   ├── public/manifest.json       # PWA Android homescreen manifest
│   ├── vite.config.ts             # Vite proxy & Tailwind v4 plugin
│   └── package.json
└── README.md
```

---

## 📄 License
MIT License. Built for hackathon demonstration.
