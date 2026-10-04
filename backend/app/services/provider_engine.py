"""
Intelligent Deployment Provider Recommendation and INR Cost Calculation Engine
"""
from typing import List, Dict, Any
from ..models import ProviderOption, ProviderTier
from ..config import settings
from .provider_adapter import get_available_providers

USD_TO_INR = 84.50  # Current conversion rate

class ProviderEngine:

    @staticmethod
    def get_provider_recommendations(framework: str, language: str, has_database: bool = False) -> List[ProviderOption]:
        """
        Calculates compatibility scores, costs in INR, pros/cons, and recommendations for providers.
        Returns: Netlify (selectable), Vercel (prototype), Render (disabled/coming soon)
        """
        fw = framework.lower()
        is_static_or_spa = any(k in fw for k in ["react", "vite", "vue", "static", "angular", "astro", "html"])
        is_nextjs = "next" in fw
        is_python = "python" in language.lower() or any(k in fw for k in ["fastapi", "flask", "django", "streamlit"])
        is_docker_or_complex = "docker" in fw or "spring" in fw or has_database

        # Get provider adapter instances to check availability
        adapters = {}
        for p in get_available_providers():
            key = p.name.lower().replace(" (prototype)", "").replace(" (coming soon)", "").replace(" ", "")
            adapters[key] = p
        deployai_adapter = adapters.get("deployaicloud")
        netlify_adapter = adapters.get("netlify")
        vercel_adapter = adapters.get("vercel")
        render_adapter = adapters.get("render")

        netlify_connected = netlify_adapter.is_available if netlify_adapter else False
        vercel_connected = vercel_adapter.is_available if vercel_adapter else False
        render_connected = render_adapter.is_available if render_adapter else False

        providers: List[ProviderOption] = []

        # Determine provider compatibility based on framework type
        is_backend_framework = is_python or is_docker_or_complex or "java" in fw or "go" in fw or "spring" in fw or "django" in fw or "flask" in fw or "fastapi" in fw
        is_static_hosting_suitable = is_static_or_spa or is_nextjs
        
        # Netlify compatibility: High for static/SPA, low for backend frameworks
        netlify_compat = 94 if is_static_hosting_suitable else (30 if is_backend_framework else 65)
        # Vercel compatibility: High for static/Next.js, low for backend
        vercel_compat = 98 if is_static_hosting_suitable else (35 if is_backend_framework else 60)
        # Render compatibility: High for backend frameworks, medium for static
        render_compat = 98 if is_python or "java" in fw or "spring" in fw or "django" in fw or "flask" in fw or "fastapi" in fw else (92 if is_docker_or_complex or is_static_or_spa else 88)

        # 0. DEPLOYAI CLOUD - real self-hosted live URLs, always available,
        # works for every framework (static output is served at /live/<id>/).
        deployai_compat = 99 if is_static_hosting_suitable else (90 if is_backend_framework else 95)
        providers.append(ProviderOption(
            id="deployai",
            name="DeployAI Cloud",
            logo="https://deployai-2.onrender.com/favicon.ico",
            category="Instant Live Hosting",
            compatibility_score=deployai_compat,
            is_recommended=True,
            free_tier_available=True,
            estimated_cost_inr_month=0.0,
            pros=[
                "REAL live URL instantly — opens and executes in the browser",
                "No third-party token needed, works for every framework",
                "Automatic SPA fallback routing",
                "Built and published by the DeployAI backend itself",
            ],
            cons=[
                "Hosted on the DeployAI backend (Render free tier sleeps when idle)",
                "Static output only — long-running servers aren't kept alive",
            ],
            recommended_reason="Best default: builds your project for real and gives an instantly-openable live URL.",
            tiers=[
                ProviderTier(
                    tier_name="Starter (Free Tier)",
                    cost_usd_month=0.0,
                    cost_inr_month=0.0,
                    bandwidth_gb="Shared with backend",
                    build_minutes="Included",
                    features=["Instant live URL", "HTTPS included", "SPA routing", "Health checks"]
                ),
            ],
            deploy_badge="Real Live Deployment"
        ))

        # 1. NETLIFY - Real integration, selectable
        providers.append(ProviderOption(
            id="netlify",
            name="Netlify",
            logo="https://www.netlify.com/favicon.ico",
            category="Jamstack & Static CDN",
            compatibility_score=netlify_compat,
            is_recommended=False,
            free_tier_available=True,
            estimated_cost_inr_month=0.0,
            pros=[
                "High-performance global Edge CDN",
                "Form submission handling built-in",
                "Split testing & branch deploy previews",
                "Serverless Netlify functions (AWS Lambda based)",
                f"{'Connected' if netlify_connected else 'Not configured - add NETLIFY_AUTH_TOKEN'}"
            ],
            cons=[
                "Strict build minutes quota on free plan (300 mins/mo)",
                "Not suitable for sustained long-running HTTP server processes",
                "Only supports static sites and edge functions" if is_backend_framework else ""
            ],
            recommended_reason="Real Netlify integration for static sites and JAMstack workflows." + (" Not suitable for backend applications." if is_backend_framework else " Deploy prepared static sample project."),
            tiers=[
                ProviderTier(
                    tier_name="Starter (Free Tier)",
                    cost_usd_month=0.0,
                    cost_inr_month=0.0,
                    bandwidth_gb="100 GB / month",
                    build_minutes="300 mins / month",
                    features=["Unlimited personal sites", "Continuous deployment", "Deploy previews", "HTTPS included"]
                ),
                ProviderTier(
                    tier_name="Pro",
                    cost_usd_month=19.0,
                    cost_inr_month=round(19.0 * USD_TO_INR),
                    bandwidth_gb="1 TB / month",
                    build_minutes="1,000 mins / month",
                    features=["Audit logs", "Role-based access", "Slack notifications", "Priority build queues"]
                )
            ],
            deploy_badge="Real Netlify Deployment"
        ))

        # 2. VERCEL - Real API integration (needs VERCEL_TOKEN)
        providers.append(ProviderOption(
            id="vercel",
            name="Vercel",
            logo="https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png",
            category="Edge CDN & Frontend",
            compatibility_score=vercel_compat,
            is_recommended=False,
            free_tier_available=True,
            estimated_cost_inr_month=0.0,
            pros=[
                "Global Edge Network with sub-50ms latency",
                "Automatic SSL certificate provisioning",
                "Instant preview deployments",
                f"{'Connected' if vercel_connected else 'Not configured - add VERCEL_TOKEN'}",
            ],
            cons=[
                "Serverless functions execution timeout (10s free / 60s pro)",
                "Not suitable for persistent background worker loops or long-lived websockets",
                "Only supports static sites and serverless functions" if is_backend_framework else "",
            ],
            recommended_reason="Real Vercel deployment for static sites and frontend workflows." + (" Falls back to DeployAI Cloud when the token is missing." if not vercel_connected else ""),
            tiers=[
                ProviderTier(
                    tier_name="Hobby (Free Tier)",
                    cost_usd_month=0.0,
                    cost_inr_month=0.0,
                    bandwidth_gb="100 GB / month",
                    build_minutes="6,000 mins / month",
                    features=["Unlimited personal projects", "Auto HTTPS/SSL", "Global CDN", "Custom domains"]
                ),
                ProviderTier(
                    tier_name="Pro",
                    cost_usd_month=20.0,
                    cost_inr_month=round(20.0 * USD_TO_INR),
                    bandwidth_gb="1 TB / month",
                    build_minutes="24,000 mins / month",
                    features=["Team collaboration", "Analytics & Web Vitals", "Password protection", "SLA guarantee"]
                )
            ],
            deploy_badge="Real Vercel Deployment"
        ))

        # 3. RENDER - Real API for GitHub-connected projects; zip uploads fall
        # back to DeployAI Cloud so they still get a real live URL.
        providers.append(ProviderOption(
            id="render",
            name="Render",
            logo="https://render.com/favicon.ico",
            category="Cloud Application Platform (PaaS)",
            compatibility_score=render_compat,
            is_recommended=is_backend_framework,
            free_tier_available=True,
            estimated_cost_inr_month=0.0,
            pros=[
                "Native Python (FastAPI/Flask), Node, Java, Go, and Docker service runtimes",
                "Free managed PostgreSQL (1GB) and Redis instances",
                "Zero downtime rolling deployments",
                f"{'Connected' if render_connected else 'Add RENDER_API_KEY + GitHub repo for direct Render services; otherwise DeployAI Cloud is used'}",
            ],
            cons=[
                "Render deploys from a GitHub repo (zip uploads use DeployAI Cloud)",
                "Free web services spin down after 15 mins of inactivity (50s cold start wake-up)",
                "Bandwidth capped at 100 GB/mo on free tier"
            ],
            recommended_reason="Best choice for backend applications with a GitHub repo." + (" Zip uploads are served via DeployAI Cloud." if is_backend_framework else ""),
            tiers=[
                ProviderTier(
                    tier_name="Individual (Free Tier)",
                    cost_usd_month=0.0,
                    cost_inr_month=0.0,
                    bandwidth_gb="100 GB / month",
                    build_minutes="500 mins / month",
                    features=["750 free web service hours/mo", "Free SSL certificate", "Free PostgreSQL (1GB)", "Auto Git deploys"]
                ),
                ProviderTier(
                    tier_name="Starter (Paid)",
                    cost_usd_month=7.0,
                    cost_inr_month=round(7.0 * USD_TO_INR),
                    bandwidth_gb="500 GB / month",
                    build_minutes="Unlimited",
                    features=["No spin-down / 0 cold start", "512MB RAM + 0.5 vCPU", "Persistent disk support", "Custom alert webhooks"]
                )
            ],
            deploy_badge="Real Render Deployment"
        ))

        # Sort: DeployAI Cloud first (always real), then Netlify, Vercel, Render
        provider_order = {"deployai": 0, "netlify": 1, "vercel": 2, "render": 3}
        providers.sort(key=lambda p: provider_order.get(p.id, 99))
        return providers