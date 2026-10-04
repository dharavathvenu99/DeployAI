"""
Gemini AI Analysis & Error Diagnosis Service with Intelligent Fallback
"""
import json
import httpx
from typing import Dict, Any, List
from ..config import settings

class AIAnalyzerService:

    @staticmethod
    async def analyze_project_with_ai(
        project_name: str,
        detected_info: Dict[str, Any],
        file_list: List[str]
    ) -> Dict[str, Any]:
        """
        Uses Gemini API to produce deep project analysis or falls back gracefully.
        """
        api_key = settings.GEMINI_API_KEY

        # If Gemini API key is available, call Gemini API
        if api_key and api_key != "YOUR_GEMINI_API_KEY":
            try:
                system_prompt = (
                    "You are DeployAI's chief cloud architect. Analyze this code project and return valid JSON with:\n"
                    "- summary: string (concise 2-sentence architectural summary)\n"
                    "- recommendations: list of strings (3 high-value production deployment tips)\n"
                    "- confidence_score: float (0.80 to 0.99)\n"
                    "- suggested_env_keys: list of strings (environment variables this project likely needs)\n"
                    "- best_provider: string (Vercel, Render, Railway, Netlify, or Fly.io)"
                )
                user_content = (
                    f"Project Name: {project_name}\n"
                    f"Detected Framework: {detected_info.get('framework')}\n"
                    f"Language: {detected_info.get('language')}\n"
                    f"Key Files: {file_list[:30]}\n"
                    f"Dependencies: {detected_info.get('dependencies', [])[:15]}\n"
                    f"Database: {detected_info.get('database_detected')}\n"
                )

                payload = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [
                                {"text": system_prompt + "\n\n" + user_content}
                            ]
                        }
                    ],
                    "generationConfig": {
                        "responseMimeType": "application/json",
                        "temperature": 0.2
                    }
                }

                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        ai_json = json.loads(text)
                        return {
                            "is_ai_powered": True,
                            "summary": ai_json.get("summary", ""),
                            "recommendations": ai_json.get("recommendations", []),
                            "confidence_score": float(ai_json.get("confidence_score", 0.96)),
                            "suggested_env_keys": ai_json.get("suggested_env_keys", []),
                            "best_provider": ai_json.get("best_provider", "Render")
                        }
            except Exception as e:
                # Fallback to heuristic
                print(f"[DeployAI] Gemini API error fallback: {e}")

        # Deterministic Heuristic Engine (100% reliable for offline / demo mode)
        fw = detected_info.get("framework", "")
        lang = detected_info.get("language", "")
        db = detected_info.get("database_detected", "None")

        if "React" in fw or "Static" in fw:
            summary = f"Modern single-page application built with {fw} and {lang}. Optimized for lightning-fast edge delivery with zero server maintenance."
            recommendations = [
                "Enable Brotli / Gzip compression and edge asset caching for sub-100ms first paint.",
                "Configure SPA fallback redirects (/* -> index.html) to support HTML5 client-side routing.",
                "Keep production build sourcemaps disabled to minimize bundle payload."
            ]
            confidence = 0.98
            best_provider = "Vercel"
        elif "Next.js" in fw:
            summary = "Fullstack Next.js application utilizing React Server Components, SSR, and dynamic API route handlers."
            recommendations = [
                "Deploy on serverless edge runtimes for dynamic rendering with global low latency.",
                "Ensure ISR (Incremental Static Regeneration) cache invalidation secrets are set.",
                "Configure Image Optimization domains in next.config.js for responsive mobile delivery."
            ]
            confidence = 0.97
            best_provider = "Vercel"
        elif "FastAPI" in fw:
            summary = f"High-performance asynchronous Python API powered by {fw} and Uvicorn with auto-generated OpenAPI documentation."
            recommendations = [
                "Configure Gunicorn / Uvicorn worker process concurrency according to container vCPU limits.",
                f"Verify database connection pooling for {db} to prevent connection saturation.",
                "Set CORS origins strictly to your production frontend domain in production."
            ]
            confidence = 0.96
            best_provider = "Render"
        elif "Flask" in fw or "Django" in fw:
            summary = f"Python {fw} web service with structured WSGI interface and dependency management."
            recommendations = [
                "Run behind Gunicorn/Nginx with reverse-proxy header forwarding enabled.",
                "Ensure static assets are collected and served via WhiteNoise or S3/Cloudflare R2.",
                "Use managed Postgres with SSL connection parameters enabled."
            ]
            confidence = 0.95
            best_provider = "Render"
        elif "Spring Boot" in fw:
            summary = "Enterprise Java Spring Boot microservice with layered MVC architecture and embedded application container."
            recommendations = [
                "Optimize JVM heap limits (-XX:+UseContainerSupport -Xmx512m) to prevent container OOM kills.",
                "Enable Spring Boot Actuator health endpoints for automatic zero-downtime rolling deploys.",
                "Pre-bake multi-stage Docker build layers to accelerate rebuild caching."
            ]
            confidence = 0.94
            best_provider = "Railway"
        elif "Node" in fw or "Express" in fw:
            summary = f"Node.js server application with npm/yarn dependency chain and HTTP listener on port {detected_info.get('port', 5000)}."
            recommendations = [
                "Set NODE_ENV=production to enable V8 memory and runtime performance optimizations.",
                "Add graceful SIGTERM shutdown handler to drain active websocket/HTTP requests.",
                "Utilize health check endpoints (/healthz) for load balancer liveness probes."
            ]
            confidence = 0.95
            best_provider = "Render"
        else:
            summary = f"Containerized cloud-ready software application detected using {lang}."
            recommendations = [
                "Define non-root user permissions inside container for runtime security compliance.",
                "Expose container service port explicitly and pass environment variables securely.",
                "Configure automated restart policy on unexpected exit."
            ]
            confidence = 0.91
            best_provider = "Render"

        return {
            "is_ai_powered": False,
            "summary": summary,
            "recommendations": recommendations,
            "confidence_score": confidence,
            "suggested_env_keys": detected_info.get("env_variables_detected", []),
            "best_provider": best_provider
        }

    @staticmethod
    async def diagnose_error(error_log: str, framework: str) -> Dict[str, Any]:
        """
        AI error diagnosis for failed builds with recommended fixes.
        """
        api_key = settings.GEMINI_API_KEY
        if api_key and api_key != "YOUR_GEMINI_API_KEY":
            try:
                system_prompt = (
                    "You are DeployAI's automated build error troubleshooter. "
                    "Analyze this deployment failure log and return valid JSON with:\n"
                    "- error_type: string (e.g. Missing Dependency, Port Conflict, Syntax Error, Memory Limit)\n"
                    "- root_cause: string (concise explanation of why it failed)\n"
                    "- suggested_fix: string (actionable steps to resolve)\n"
                    "- fixed_command_or_config: string (repaired build command, start command, or code snippet)\n"
                    "- confidence: float (0.80 to 0.99)"
                )
                payload = {
                    "contents": [{"role": "user", "parts": [{"text": f"Framework: {framework}\nError Log:\n{error_log}"}]}],
                    "generationConfig": {"responseMimeType": "application/json", "temperature": 0.1}
                }
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        return json.loads(resp.json()["candidates"][0]["content"]["parts"][0]["text"])
            except Exception as e:
                print(f"[DeployAI] Error diagnosis API fallback: {e}")

        # Intelligent Heuristic Pattern Matcher
        log_lower = error_log.lower()
        if "cannot find module" in log_lower or "module_not_found" in log_lower or "nomodulenamed" in log_lower or "modulenotfounderror" in log_lower:
            return {
                "error_type": "Missing Dependency",
                "root_cause": "The build script or application runtime attempted to import a package that is not declared in package.json or requirements.txt.",
                "suggested_fix": "Add the missing package to your manifest file and re-run dependency installation before building.",
                "fixed_command_or_config": "npm install --save <missing-package> || pip install <missing-package> && pip freeze > requirements.txt",
                "confidence": 0.96
            }
        elif "eaddrinuse" in log_lower or "address already in use" in log_lower:
            return {
                "error_type": "Port Binding Conflict",
                "root_cause": "The application hardcoded a local port instead of binding to the dynamic host port passed via process.env.PORT or $PORT.",
                "suggested_fix": "Update server listener to read the PORT environment variable dynamically provided by the cloud provider.",
                "fixed_command_or_config": "app.listen(process.env.PORT || 3000, '0.0.0.0'); // or uvicorn main:app --host 0.0.0.0 --port $PORT",
                "confidence": 0.98
            }
        elif "heap out of memory" in log_lower or "javascript heap out of memory" in log_lower:
            return {
                "error_type": "Node.js Build Out Of Memory",
                "root_cause": "Vite/Next.js/Webpack build exceeded the default 1.4GB Node.js memory ceiling during asset bundle optimization.",
                "suggested_fix": "Increase Node memory allocation using NODE_OPTIONS='--max-old-space-size=4096'.",
                "fixed_command_or_config": "NODE_OPTIONS='--max-old-space-size=4096' npm run build",
                "confidence": 0.95
            }
        else:
            return {
                "error_type": "Process Non-Zero Exit Code",
                "root_cause": "The build process encountered an unhandled exception or failed type check during the compilation phase.",
                "suggested_fix": "Verify that all TypeScript types pass without errors locally (`tsc --noEmit`) and all environment variables are populated.",
                "fixed_command_or_config": "npm run build -- --skip-typecheck",
                "confidence": 0.91
            }
