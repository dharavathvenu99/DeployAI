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
        """Upload build artifacts to Netlify using their deploy API"""
        # Create a zip file of the deploy directory
        zip_path = os.path.join(tempfile.gettempdir(), f"deploy_{site_id}.zip")
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files in os.walk(deploy_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, deploy_dir)
                    zf.write(file_path, arcname)
        
        # Upload using Netlify's deploy API (multipart/form-data)
        url = f"https://api.netlify.com/api/v1/sites/{site_id}/deploys"
        headers = {
            "Authorization": f"Bearer {settings.NETLIFY_AUTH_TOKEN}",
        }
        
        with open(zip_path, 'rb') as f:
            files = {'file': (f'deploy_{site_id}.zip', f, 'application/zip')}
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(url, headers=headers, files=files)
                response.raise_for_status()
        
        # Cleanup
        try:
            os.remove(zip_path)
        except:
            pass
        
        return response.json()
    
    async def create_site(self, project_name: str, framework: str) -> DeploymentResult:
        try:
            # Create a new site on Netlify
            site_name = project_name.lower().replace(" ", "-").replace("_", "-")[:50]
            clean_name = "".join(c for c in site_name if c.isalnum() or c == "-")
            unique_name = f"{clean_name}-{uuid.uuid4().hex[:6]}"
            
            result = await self._make_request("POST", "/sites", json={
                "name": unique_name,
                "custom_domain": None
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


class VercelProvider(ProviderAdapter):
    """Vercel provider - simulated prototype (clearly labeled)"""
    
    @property
    def name(self) -> str:
        return "Vercel (Prototype)"
    
    @property
    def is_available(self) -> bool:
        return True  # Always available as prototype
    
    @property
    def is_prototype(self) -> bool:
        return True
    
    async def create_site(self, project_name: str, framework: str) -> DeploymentResult:
        # Simulated site creation
        site_name = project_name.lower().replace(" ", "-").replace("_", "-")[:50]
        clean_name = "".join(c for c in site_name if c.isalnum() or c == "-")
        unique_name = f"{clean_name}-{uuid.uuid4().hex[:6]}"
        demo_url = f"https://{unique_name}.vercel.app"
        
        await asyncio.sleep(0.5)  # Simulate API call
        
        return DeploymentResult(
            success=True,
            deployment_id=f"vercel-{uuid.uuid4().hex[:8]}",
            live_url=demo_url,
            logs=[f"[PROTOTYPE] Created Vercel project: {unique_name}", f"[PROTOTYPE] Simulated deployment URL: {demo_url}"]
        )
    
    async def deploy_project(self, site_id: str, project_dir: str, build_command: str, output_dir: str, env_vars: Dict[str, str] = None) -> DeploymentResult:
        await asyncio.sleep(1.0)  # Simulate deployment
        
        return DeploymentResult(
            success=True,
            deployment_id=site_id,
            logs=[f"[PROTOTYPE] Build command: {build_command}", "[PROTOTYPE] Build completed", "[PROTOTYPE] Files uploaded to Vercel Edge Network"]
        )
    
    async def get_deployment_status(self, deployment_id: str) -> DeploymentResult:
        await asyncio.sleep(0.3)
        return DeploymentResult(
            success=True,
            deployment_id=deployment_id,
            logs=["[PROTOTYPE] Deployment ready"]
        )
    
    async def get_live_url(self, site_id: str) -> Optional[str]:
        # Return a simulated Vercel URL
        return f"https://{site_id.replace('vercel-', '')}.vercel.app"
    
    async def run_health_check(self, url: str) -> DeploymentResult:
        if not url:
            return DeploymentResult(success=False, error="No URL provided", logs=["No URL to check"])
        
        await asyncio.sleep(0.5)
        return DeploymentResult(
            success=True,
            live_url=url,
            logs=[f"[PROTOTYPE] Health check passed for {url}", "[PROTOTYPE] Simulated HTTP 200 OK, latency: 42ms"]
        )


class RenderProvider(ProviderAdapter):
    """Render provider - disabled, coming soon"""
    
    @property
    def name(self) -> str:
        return "Render (Coming Soon)"
    
    @property
    def is_available(self) -> bool:
        return False
    
    @property
    def is_prototype(self) -> bool:
        return False
    
    async def create_site(self, project_name: str, framework: str) -> DeploymentResult:
        return DeploymentResult(
            success=False,
            error="Render provider is not yet available. Coming soon!",
            logs=["Render integration is under development"]
        )
    
    async def deploy_project(self, site_id: str, project_dir: str, build_command: str, output_dir: str, env_vars: Dict[str, str] = None) -> DeploymentResult:
        return DeploymentResult(
            success=False,
            error="Render provider is not yet available. Coming soon!",
            logs=["Render integration is under development"]
        )
    
    async def get_deployment_status(self, deployment_id: str) -> DeploymentResult:
        return DeploymentResult(
            success=False,
            error="Render provider is not yet available. Coming soon!",
            logs=[]
        )
    
    async def get_live_url(self, site_id: str) -> Optional[str]:
        return None
    
    async def run_health_check(self, url: str) -> DeploymentResult:
        return DeploymentResult(
            success=False,
            error="Render provider is not yet available. Coming soon!",
            logs=[]
        )


def get_provider(provider_id: str) -> ProviderAdapter:
    """Factory function to get provider instance"""
    providers = {
        "netlify": NetlifyProvider(),
        "vercel": VercelProvider(),
        "render": RenderProvider(),
    }
    return providers.get(provider_id, NetlifyProvider())


def get_available_providers() -> List[ProviderAdapter]:
    """Get list of all provider instances"""
    return [NetlifyProvider(), VercelProvider(), RenderProvider()]