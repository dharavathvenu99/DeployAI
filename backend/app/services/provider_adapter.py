"""
Provider Adapter Interface and Implementations
Supports Netlify (real), Vercel (simulated prototype), Render (disabled/coming soon)
"""
import asyncio
import httpx
import uuid
import os
import json
import shutil
import tempfile
import zipfile
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
from ..config import settings


@dataclass
class DeploymentResult:
    success: bool
    live_url: Optional[str] = None
    deployment_id: Optional[str] = None
    error: Optional[str] = None
    logs: List[str] = None
    
    def __post_init__(self):
        if self.logs is None:
            self.logs = []


class ProviderAdapter(ABC):
    """Abstract base class for deployment providers"""
    
    @property
    @abstractmethod
    def name(self) -> str:
        pass
    
    @property
    @abstractmethod
    def is_available(self) -> bool:
        pass
    
    @property
    @abstractmethod
    def is_prototype(self) -> bool:
        """True for simulated/prototype providers"""
        pass
    
    @abstractmethod
    async def create_site(self, project_name: str, framework: str) -> DeploymentResult:
        """Create a new site/project on the provider"""
        pass
    
    @abstractmethod
    async def deploy_project(self, site_id: str, project_dir: str, build_command: str, output_dir: str, env_vars: Dict[str, str] = None) -> DeploymentResult:
        """Deploy project files to the provider"""
        pass
    
    @abstractmethod
    async def get_deployment_status(self, deployment_id: str) -> DeploymentResult:
        """Get deployment status"""
        pass
    
    @abstractmethod
    async def get_live_url(self, site_id: str) -> Optional[str]:
        """Get the live URL for a deployed site"""
        pass
    
    @abstractmethod
    async def run_health_check(self, url: str) -> DeploymentResult:
        """Run health check on deployed URL"""
        pass


class NetlifyProvider(ProviderAdapter):
    """Netlify provider with real API integration"""
    
    @property
    def name(self) -> str:
        return "Netlify"
    
    @property
    def is_available(self) -> bool:
        return bool(settings.NETLIFY_AUTH_TOKEN and settings.NETLIFY_AUTH_TOKEN != "your_netlify_auth_token_here")
    
    @property
    def is_prototype(self) -> bool:
        return False
    
    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make authenticated request to Netlify API"""
        if not self.is_available:
            raise ValueError("Netlify is not configured. Add NETLIFY_AUTH_TOKEN to the server environment.")
        
        headers = {
            "Authorization": f"Bearer {settings.NETLIFY_AUTH_TOKEN}",
            "Content-Type": "application/json",
        }
        url = f"https://api.netlify.com/api/v1{endpoint}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(method, url, headers=headers, **kwargs)
            response.raise_for_status()
            return response.json()
    
    async def _upload_deploy_files(self, site_id: str, deploy_dir: str) -> Dict[str, Any]:
        """Upload build artifacts to Netlify using their deploy API (raw zip body)."""
        # Create a zip file of the deploy directory
        zip_path = os.path.join(tempfile.gettempdir(), f"deploy_{site_id}.zip")

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files in os.walk(deploy_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, deploy_dir)
                    zf.write(file_path, arcname)

        # Upload using Netlify's deploy API.
        # Netlify expects the raw zip bytes with Content-Type: application/zip
        # (multipart/form-data uploads are rejected).
        url = f"https://api.netlify.com/api/v1/sites/{site_id}/deploys"
        headers = {
            "Authorization": f"Bearer {settings.NETLIFY_AUTH_TOKEN}",
            "Content-Type": "application/zip",
        }

        with open(zip_path, 'rb') as f:
            zip_bytes = f.read()
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, headers=headers, content=zip_bytes)
            response.raise_for_status()
            data = response.json()

        # Cleanup
        try:
            os.remove(zip_path)
        except Exception:
            pass

        return data
    
    async def create_site(self, project_name: str, framework: str) -> DeploymentResult:
        try:
            # Create a new site on Netlify
            site_name = project_name.lower().replace(" ", "-").replace("_", "-")[:50]
            clean_name = "".join(c for c in site_name if c.isalnum() or c == "-")
            unique_name = f"{clean_name}-{uuid.uuid4().hex[:6]}"

            # NOTE: do not send custom_domain=None — Netlify rejects explicit null.
            result = await self._make_request("POST", "/sites", json={
                "name": unique_name,
            })
            
            site_id = result.get("id")
            return DeploymentResult(
                success=True,
                deployment_id=site_id,
                live_url=result.get("ssl_url") or result.get("url"),
                logs=[f"Created Netlify site: {unique_name}", f"Site ID: {site_id}"]
            )
        except Exception as e:
            return DeploymentResult(
                success=False,
                error=f"Failed to create Netlify site: {str(e)}",
                logs=[f"Error: {str(e)}"]
            )
    
    async def deploy_project(self, site_id: str, project_dir: str, build_command: str, output_dir: str, env_vars: Dict[str, str] = None) -> DeploymentResult:
        try:
            # Find the actual build output directory
            deploy_dir = os.path.join(project_dir, output_dir) if output_dir else project_dir

            # If specified output_dir doesn't exist, search common build output folders
            if not os.path.exists(deploy_dir):
                fallback_dirs = ["dist", "build", "out", ".next", "public", "."]
                found = False
                for candidate in fallback_dirs:
                    candidate_path = os.path.join(project_dir, candidate) if candidate != "." else project_dir
                    if os.path.exists(candidate_path) and os.path.isdir(candidate_path):
                        index_candidate = os.path.join(candidate_path, "index.html")
                        if os.path.exists(index_candidate):
                            deploy_dir = candidate_path
                            found = True
                            break
                if not found:
                    return DeploymentResult(
                        success=False,
                        error=f"Build output directory not found: {deploy_dir}. Build may have failed or output_dir is misconfigured.",
                        logs=[f"Expected output dir: {output_dir}", f"Project dir: {project_dir}",
                              f"Project contents: {os.listdir(project_dir) if os.path.exists(project_dir) else 'N/A'}"]
                    )

            # Check if there's an index.html (for static sites)
            index_path = os.path.join(deploy_dir, "index.html")
            if not os.path.exists(index_path):
                # Check for common alternatives
                for alt in ["index.htm", "index.php"]:
                    alt_path = os.path.join(deploy_dir, alt)
                    if os.path.exists(alt_path):
                        break
                else:
                    return DeploymentResult(
                        success=False,
                        error=f"No index.html found in build output: {deploy_dir}",
                        logs=[f"Contents: {os.listdir(deploy_dir)}"]
                    )
            
            # Create _redirects file for SPA routing if not present
            redirects_path = os.path.join(deploy_dir, "_redirects")
            if not os.path.exists(redirects_path):
                with open(redirects_path, "w") as f:
                    f.write("/*  /index.html  200\n")
            
            # Create netlify.toml for build configuration
            netlify_toml = os.path.join(deploy_dir, "netlify.toml")
            if not os.path.exists(netlify_toml):
                with open(netlify_toml, "w") as f:
                    f.write(f'''[build]
  publish = "."
  command = "{build_command}"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  node_bundler = "esbuild"
''')
            
            # Upload build artifacts
            deploy_result = await self._upload_deploy_files(site_id, deploy_dir)
            
            deploy_id = deploy_result.get("id")
            return DeploymentResult(
                success=True,
                deployment_id=deploy_id,
                live_url=deploy_result.get("ssl_url") or deploy_result.get("deploy_ssl_url") or deploy_result.get("url"),
                logs=[f"Deployment created: {deploy_id}", f"Uploaded {len(os.listdir(deploy_dir))} files from {output_dir}", "Build completed"]
            )
        except Exception as e:
            return DeploymentResult(
                success=False,
                error=f"Failed to deploy to Netlify: {str(e)}",
                logs=[f"Error: {str(e)}"]
            )
    
    async def get_deployment_status(self, deployment_id: str) -> DeploymentResult:
        try:
            result = await self._make_request("GET", f"/deploys/{deployment_id}")
            state = result.get("state", "unknown")
            
            is_success = state == "ready"
            is_building = state in ["building", "preparing", "pending"]
            is_failed = state in ["error", "failed"]
            
            return DeploymentResult(
                success=is_success,
                live_url=result.get("ssl_url") or result.get("url") if is_success else None,
                deployment_id=deployment_id,
                logs=[f"Deployment state: {state}"]
            )
        except Exception as e:
            return DeploymentResult(
                success=False,
                error=f"Failed to get deployment status: {str(e)}",
                logs=[f"Error: {str(e)}"]
            )
    
    async def get_live_url(self, site_id: str) -> Optional[str]:
        try:
            result = await self._make_request("GET", f"/sites/{site_id}")
            return result.get("ssl_url") or result.get("url")
        except Exception:
            return None
    
    async def run_health_check(self, url: str) -> DeploymentResult:
        if not url:
            return DeploymentResult(success=False, error="No URL provided", logs=["No URL to check"])
        
        # Validate URL security
        if not self._is_safe_url(url):
            return DeploymentResult(success=False, error="Invalid URL for health check", logs=["URL failed security validation"])
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                is_healthy = response.status_code < 400
                return DeploymentResult(
                    success=is_healthy,
                    live_url=url,
                    logs=[f"Health check: HTTP {response.status_code}", f"Latency: {response.elapsed.total_seconds()*1000:.0f}ms"]
                )
        except Exception as e:
            return DeploymentResult(
                success=False,
                error=f"Health check failed: {str(e)}",
                logs=[f"Error: {str(e)}"]
            )
    
    def _is_safe_url(self, url: str) -> bool:
        """Validate URL for security - reject localhost, private IPs, etc."""
        try:
            from urllib.parse import urlparse
            import ipaddress
            
            parsed = urlparse(url)
            if parsed.scheme != "https":
                return False
            
            hostname = parsed.hostname or ""
            
            # Reject localhost
            if hostname in ("localhost", "127.0.0.1", "::1"):
                return False
            
            # Reject private IP ranges
            try:
                ip = ipaddress.ip_address(hostname)
                if ip.is_private or ip.is_loopback or ip.is_link_local:
                    return False
            except ValueError:
                # Not an IP address, check hostname
                if hostname.endswith(".local") or hostname.endswith(".internal"):
                    return False
            
            return True
        except Exception:
            return False


def _resolve_deploy_dir(project_dir: str, output_dir: str) -> Optional[str]:
    """Find the directory holding the built static files (must contain index.html)."""
    candidates: List[str] = []
    if output_dir:
        candidates.append(os.path.join(project_dir, output_dir))
    for fallback in ["dist", "build", "out", "public", "."]:
        p = os.path.join(project_dir, fallback) if fallback != "." else project_dir
        if p not in candidates:
            candidates.append(p)
    for candidate in candidates:
        if os.path.isdir(candidate) and os.path.exists(os.path.join(candidate, "index.html")):
            return candidate
    # Last resort: any dir with an index.html (1 level deep search)
    if os.path.isdir(project_dir):
        for entry in os.listdir(project_dir):
            p = os.path.join(project_dir, entry)
            if os.path.isdir(p) and os.path.exists(os.path.join(p, "index.html")):
                return p
    return None


class DeployAIProvider(ProviderAdapter):
    """DeployAI Cloud — REAL self-hosted live hosting on this backend.

    Builds the project for real (the deployer runs the build first), publishes
    the static output to uploads/live/<site_id>/ and serves it at
    {BACKEND_URL}/live/<site_id}/. The URL is real, public and executes in a
    browser the moment the deployment succeeds — no third-party token needed.
    """

    @property
    def name(self) -> str:
        return "DeployAI Cloud"

    @property
    def is_available(self) -> bool:
        return True  # Always available — hosted by this backend

    @property
    def is_prototype(self) -> bool:
        return False

    def _live_url(self, site_id: str) -> str:
        return f"{settings.LIVE_BASE_URL.rstrip('/')}/live/{site_id}/"

    async def create_site(self, project_name: str, framework: str) -> DeploymentResult:
        site_id = uuid.uuid4().hex[:8]
        target = os.path.join(settings.LIVE_DIR, site_id)
        os.makedirs(target, exist_ok=True)
        return DeploymentResult(
            success=True,
            deployment_id=site_id,
            live_url=self._live_url(site_id),
            logs=[f"Provisioned DeployAI Cloud live slot: {site_id}",
                   f"Live URL reserved: {self._live_url(site_id)}"],
        )

    async def deploy_project(self, site_id: str, project_dir: str, build_command: str, output_dir: str, env_vars: Dict[str, str] = None) -> DeploymentResult:
        try:
            deploy_dir = _resolve_deploy_dir(project_dir, output_dir)
            if not deploy_dir:
                listing = os.listdir(project_dir) if os.path.isdir(project_dir) else []
                return DeploymentResult(
                    success=False,
                    error=f"Build output not found (looked for index.html in '{output_dir}', dist/, build/, public/). Build may have failed.",
                    logs=[f"Project dir contents: {listing}"],
                )
            target = os.path.join(settings.LIVE_DIR, site_id)
            os.makedirs(settings.LIVE_DIR, exist_ok=True)
            if os.path.exists(target):
                shutil.rmtree(target, ignore_errors=True)
            shutil.copytree(deploy_dir, target)
            # SPA fallback so client-side routes execute instead of 404
            index = os.path.join(target, "index.html")
            count = sum(len(files) for _, _, files in os.walk(target))
            return DeploymentResult(
                success=True,
                deployment_id=site_id,
                live_url=self._live_url(site_id),
                logs=[f"Published {count} files from {os.path.relpath(deploy_dir, project_dir)}",
                      f"index.html present: {os.path.exists(index)}",
                      "SPA fallback enabled (/live/<id>/* → index.html)"],
            )
        except Exception as e:
            return DeploymentResult(success=False, error=f"DeployAI Cloud publish failed: {e}", logs=[str(e)])

    async def get_deployment_status(self, deployment_id: str) -> DeploymentResult:
        target = os.path.join(settings.LIVE_DIR, deployment_id)
        ready = os.path.exists(os.path.join(target, "index.html"))
        return DeploymentResult(
            success=ready,
            live_url=self._live_url(deployment_id) if ready else None,
            deployment_id=deployment_id,
            logs=["Live slot ready" if ready else "Live slot not published yet"],
        )

    async def get_live_url(self, site_id: str) -> Optional[str]:
        return self._live_url(site_id)

    async def run_health_check(self, url: str) -> DeploymentResult:
        if not url:
            return DeploymentResult(success=False, error="No URL provided", logs=["No URL to check"])
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                resp = await client.get(url)
                ok = resp.status_code < 400
                return DeploymentResult(
                    success=ok,
                    live_url=url,
                    logs=[f"Health check: HTTP {resp.status_code}",
                          f"Latency: {resp.elapsed.total_seconds()*1000:.0f}ms"],
                    error=None if ok else f"Live URL returned HTTP {resp.status_code}",
                )
        except Exception as e:
            return DeploymentResult(success=False, error=f"Health check failed: {e}", logs=[str(e)])


class VercelProvider(ProviderAdapter):
    """Vercel provider — REAL API integration (falls back with a clear error)."""

    @property
    def name(self) -> str:
        return "Vercel"

    @property
    def is_available(self) -> bool:
        token = settings.VERCEL_TOKEN or ""
        return bool(token and token not in ("your_vercel_token_here", "change-me"))

    @property
    def is_prototype(self) -> bool:
        return False

    def _headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {settings.VERCEL_TOKEN}", "Content-Type": "application/json"}

    async def create_site(self, project_name: str, framework: str) -> DeploymentResult:
        if not self.is_available:
            return DeploymentResult(success=False, error="Vercel token not configured (VERCEL_TOKEN).", logs=["Add VERCEL_TOKEN on the backend to enable real Vercel deploys."])
        try:
            site_name = project_name.lower().replace(" ", "-").replace("_", "-")[:50]
            clean_name = "".join(c for c in site_name if c.isalnum() or c == "-").strip("-") or "app"
            unique_name = f"{clean_name}-{uuid.uuid4().hex[:6]}"
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.vercel.com/v9/projects",
                    headers=self._headers(),
                    json={"name": unique_name, "framework": None},
                )
                resp.raise_for_status()
                data = resp.json()
            project_id = data.get("id")
            return DeploymentResult(
                success=True, deployment_id=project_id or unique_name,
                live_url=None,
                logs=[f"Created Vercel project: {unique_name}", f"Project ID: {project_id}"],
            )
        except Exception as e:
            return DeploymentResult(success=False, error=f"Failed to create Vercel project: {e}", logs=[str(e)])

    def _collect_files(self, deploy_dir: str, limit_files: int = 200, max_bytes: int = 8 * 1024 * 1024) -> List[Dict[str, Any]]:
        import base64
        collected: List[Dict[str, Any]] = []
        total = 0
        for root, dirs, files in os.walk(deploy_dir):
            dirs[:] = [d for d in dirs if d not in ("node_modules", ".git")]
            for fn in files:
                fp = os.path.join(root, fn)
                rel = os.path.relpath(fp, deploy_dir).replace(os.sep, "/")
                try:
                    size = os.path.getsize(fp)
                except OSError:
                    continue
                if size > 2 * 1024 * 1024 or total + size > max_bytes or len(collected) >= limit_files:
                    continue
                with open(fp, "rb") as f:
                    raw = f.read()
                collected.append({"file": rel, "data": base64.b64encode(raw).decode(), "encoding": "base64"})
                total += size
        # SPA fallback
        if not any(f["file"] == "vercel.json" for f in collected):
            import json as _json
            cfg = _json.dumps({"routes": [{"src": "/(.*)", "dest": "/index.html"}]}).encode()
            import base64 as _b64
            collected.append({"file": "vercel.json", "data": _b64.b64encode(cfg).decode(), "encoding": "base64"})
        return collected

    async def deploy_project(self, site_id: str, project_dir: str, build_command: str, output_dir: str, env_vars: Dict[str, str] = None) -> DeploymentResult:
        if not self.is_available:
            return DeploymentResult(success=False, error="Vercel token not configured.", logs=[])
        try:
            deploy_dir = _resolve_deploy_dir(project_dir, output_dir) or project_dir
            files = self._collect_files(deploy_dir)
            if not files:
                return DeploymentResult(success=False, error="No files to deploy.", logs=[])
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(
                    f"https://api.vercel.com/v13/deployments?skipAutoDetection=true",
                    headers=self._headers(),
                    json={"name": site_id, "project": site_id, "files": files,
                          "projectSettings": {"framework": None, "outputDirectory": "."}},
                )
                resp.raise_for_status()
                data = resp.json()
            dep_id = data.get("id")
            url = data.get("url")
            live = f"https://{url}" if url else None
            return DeploymentResult(success=True, deployment_id=dep_id, live_url=live,
                                    logs=[f"Deployment created: {dep_id}", f"Uploaded {len(files)} files", f"URL: {live}"])
        except Exception as e:
            return DeploymentResult(success=False, error=f"Vercel deploy failed: {e}", logs=[str(e)])

    async def get_deployment_status(self, deployment_id: str) -> DeploymentResult:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(f"https://api.vercel.com/v13/deployments/{deployment_id}", headers=self._headers())
                resp.raise_for_status()
                data = resp.json()
            state = (data.get("state") or data.get("status") or "unknown").upper()
            ready = state == "READY"
            url = data.get("url")
            live = f"https://{url}" if url else None
            return DeploymentResult(success=ready, live_url=live if ready else None,
                                    deployment_id=deployment_id, logs=[f"Vercel state: {state}"])
        except Exception as e:
            return DeploymentResult(success=False, error=str(e), logs=[str(e)])

    async def get_live_url(self, site_id: str) -> Optional[str]:
        return None

    async def run_health_check(self, url: str) -> DeploymentResult:
        if not url:
            return DeploymentResult(success=False, error="No URL provided", logs=["No URL to check"])
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                resp = await client.get(url)
                ok = resp.status_code < 400
                return DeploymentResult(success=ok, live_url=url,
                                        logs=[f"Health check: HTTP {resp.status_code}"],
                                        error=None if ok else f"HTTP {resp.status_code}")
        except Exception as e:
            return DeploymentResult(success=False, error=f"Health check failed: {e}", logs=[str(e)])


class RenderProvider(ProviderAdapter):
    """Render provider — REAL API when a GitHub repo + RENDER_API_KEY exist.

    Render only deploys from a git repository, not from a zip upload, so for
    zip/sample projects the deployer automatically falls back to DeployAI Cloud
    (which still yields a REAL executable live URL). When the project has a
    github_url and RENDER_API_KEY is set, a real Render web/static service is
    created via the Render REST API.
    """

    @property
    def name(self) -> str:
        return "Render"

    @property
    def is_available(self) -> bool:
        key = settings.RENDER_API_KEY or ""
        return bool(key and key not in ("your_railway_api_key_here", "change-me", "your_render_api_key_here"))

    @property
    def is_prototype(self) -> bool:
        return False

    def _headers(self) -> Dict[str, str]:
        owner = os.getenv("RENDER_OWNER_ID", "")
        headers = {"Authorization": f"Bearer {settings.RENDER_API_KEY}", "Content-Type": "application/json"}
        if owner:
            headers["owner-id"] = owner
        return headers

    async def create_site(self, project_name: str, framework: str) -> DeploymentResult:
        # Without a repo we cannot call Render yet — signal the deployer to
        # fall back to DeployAI Cloud instead of failing the deployment.
        return DeploymentResult(
            success=False,
            error="RENDER_NEEDS_REPO: Render deploys from a GitHub repo. Connect a GitHub repo or use DeployAI Cloud / Netlify / Vercel for zip uploads.",
            logs=["Render requires a GitHub repository URL; zip upload has no repo to link."],
        )

    async def create_service_from_repo(self, project_name: str, repo_url: str, framework: str,
                                       build_command: str = "", start_command: str = "",
                                       output_dir: str = "", env_vars: Dict[str, str] = None) -> DeploymentResult:
        if not self.is_available:
            return DeploymentResult(success=False, error="Render API key not configured (RENDER_API_KEY).", logs=[])
        try:
            fw = (framework or "").lower()
            is_static = any(k in fw for k in ["react", "vite", "vue", "static", "angular", "html"])
            slug = "".join(c for c in project_name.lower().replace(" ", "-") if c.isalnum() or c == "-")[:40] or "app"
            name = f"{slug}-{uuid.uuid4().hex[:4]}"
            if is_static:
                payload = {"type": "static_site", "name": name, "repo": repo_url,
                           "buildCommand": build_command or "npm run build",
                           "publishPath": output_dir or "dist"}
            else:
                payload = {"type": "web_service", "name": name, "repo": repo_url,
                           "branch": "main", "buildCommand": build_command or "",
                           "startCommand": start_command or "",
                           "plan": "free", "envVars": [{"key": k, "value": v} for k, v in (env_vars or {}).items()]}
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post("https://api.render.com/v1/services", headers=self._headers(), json=payload)
                resp.raise_for_status()
                data = resp.json()
            svc = data.get("service", data)
            svc_id = svc.get("id")
            url = svc.get("serviceDetails", {}).get("url") if isinstance(svc.get("serviceDetails"), dict) else None
            live = f"https://{url}" if url and not str(url).startswith("http") else url
            return DeploymentResult(success=True, deployment_id=svc_id, live_url=live,
                                    logs=[f"Created Render service: {name}", f"Service ID: {svc_id}"])
        except Exception as e:
            return DeploymentResult(success=False, error=f"Render service creation failed: {e}", logs=[str(e)])

    async def deploy_project(self, site_id: str, project_dir: str, build_command: str, output_dir: str, env_vars: Dict[str, str] = None) -> DeploymentResult:
        return DeploymentResult(
            success=False,
            error="RENDER_NEEDS_REPO: Render deploys from a GitHub repo.",
            logs=["Use a GitHub-connected project for Render, or DeployAI Cloud for instant live URLs."],
        )

    async def get_deployment_status(self, deployment_id: str) -> DeploymentResult:
        if not self.is_available:
            return DeploymentResult(success=False, error="Render API key not configured.", logs=[])
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(f"https://api.render.com/v1/services/{deployment_id}", headers=self._headers())
                resp.raise_for_status()
                data = resp.json()
            svc = data.get("service", data)
            status = str(svc.get("suspended", "")).lower()
            url = (svc.get("serviceDetails", {}) or {}).get("url") if isinstance(svc.get("serviceDetails"), dict) else None
            live = f"https://{url}" if url and not str(url).startswith("http") else url
            ready = "suspend" not in status
            return DeploymentResult(success=ready, live_url=live if ready else None,
                                    deployment_id=deployment_id, logs=[f"Render service: {svc.get('name')}"])
        except Exception as e:
            return DeploymentResult(success=False, error=str(e), logs=[str(e)])

    async def get_live_url(self, site_id: str) -> Optional[str]:
        result = await self.get_deployment_status(site_id)
        return result.live_url

    async def run_health_check(self, url: str) -> DeploymentResult:
        if not url:
            return DeploymentResult(success=False, error="No URL provided", logs=["No URL to check"])
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                resp = await client.get(url)
                ok = resp.status_code < 400
                return DeploymentResult(success=ok, live_url=url,
                                        logs=[f"Health check: HTTP {resp.status_code}"],
                                        error=None if ok else f"HTTP {resp.status_code}")
        except Exception as e:
            return DeploymentResult(success=False, error=f"Health check failed: {e}", logs=[str(e)])


def get_provider(provider_id: str) -> ProviderAdapter:
    """Factory function to get provider instance"""
    providers = {
        "deployai": DeployAIProvider(),
        "netlify": NetlifyProvider(),
        "vercel": VercelProvider(),
        "render": RenderProvider(),
    }
    return providers.get((provider_id or "").lower(), DeployAIProvider())


def get_available_providers() -> List[ProviderAdapter]:
    """Get list of all provider instances"""
    return [DeployAIProvider(), NetlifyProvider(), VercelProvider(), RenderProvider()]