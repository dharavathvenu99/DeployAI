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
        adapters = {p.name.lower().replace(" (prototype)", "").replace(" (coming soon)", "").replace(" ", ""): p for p in get_available_providers()}
        netlify_adapter = adapters.get("netlify")
        vercel_adapter = adapters.get("vercel")
        render_adapter = adapters.get("render")

        netlify_connected = netlify_adapter.is_available if netlify_adapter else False
        vercel_available = vercel_adapter.is_available if vercel_adapter else True  # Prototype always available
        render_available = render_adapter.is_available if render_adapter else False

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

        # 2. VERCEL - Prototype/simulated, selectable
        providers.append(ProviderOption(
            id="vercel",
            name="Vercel (Prototype)",
            logo="https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png",
            category="Edge CDN & Frontend (Simulated)",
            compatibility_score=vercel_compat,
            is_recommended=False,
            free_tier_available=True,
            estimated_cost_inr_month=0.0,
            pros=[
                "Global Edge Network with sub-50ms latency (simulated)",
                "Automatic SSL certificate provisioning (simulated)",
                "Instant git preview deployments on pull requests (simulated)",
                "Zero cold-start edge middleware (simulated)",
                "Clearly labeled as prototype - no real deployment"
            ],
            cons=[
                "PROTOTYPE: Deployment is simulated, not real",
                "Serverless functions execution timeout (10s free / 60s pro)",
                "Not suitable for persistent background worker loops or long-lived websockets",
                "Only supports static sites and serverless functions" if is_backend_framework else ""
            ],
            recommended_reason="PROTOTYPE: Simulated Vercel deployment for demo purposes." + (" Not suitable for backend applications." if is_backend_framework else " Does not create real deployments."),
            tiers=[
                ProviderTier(
                    tier_name="Hobby (Free Tier) - Simulated",
                    cost_usd_month=0.0,
                    cost_inr_month=0.0,
                    bandwidth_gb="100 GB / month",
                    build_minutes="6,000 mins / month",
                    features=["Unlimited personal projects (simulated)", "Auto HTTPS/SSL (simulated)", "Global CDN (simulated)", "Custom domains (simulated)"]
                ),
                ProviderTier(
                    tier_name="Pro - Simulated",
                    cost_usd_month=20.0,
                    cost_inr_month=round(20.0 * USD_TO_INR),
                    bandwidth_gb="1 TB / month",
                    build_minutes="24,000 mins / month",
                    features=["Team collaboration (simulated)", "Analytics & Web Vitals (simulated)", "Password protection (simulated)", "SLA guarantee (simulated)"]
                )
            ],
            deploy_badge="Simulated Deployment"
        ))

        # 3. RENDER - Disabled, Coming Soon
        providers.append(ProviderOption(
            id="render",
            name="Render (Coming Soon)",
            logo="https://render.com/favicon.ico",
            category="Cloud Application Platform (PaaS) - Disabled",
            compatibility_score=render_compat,
            is_recommended=False,
            free_tier_available=False,  # Disabled
            estimated_cost_inr_month=0.0,
            pros=[
                "Native Python (FastAPI/Flask), Node, Java, Go, and Docker service runtimes",
                "Free managed PostgreSQL (1GB) and Redis instances",
                "Zero downtime rolling deployments",
                "Built-in health checks and custom HTTP probe URLs"
            ],
            cons=[
                "DISABLED: Render integration is not yet implemented",
                "Free web services spin down after 15 mins of inactivity (50s cold start wake-up)",
                "Bandwidth capped at 100 GB/mo on free tier"
            ],
            recommended_reason="Render provider is coming soon. Currently disabled." + (" Best choice for backend applications." if is_backend_framework else ""),
            tiers=[
                ProviderTier(
                    tier_name="Individual (Free Tier) - Coming Soon",
                    cost_usd_month=0.0,
                    cost_inr_month=0.0,
                    bandwidth_gb="100 GB / month",
                    build_minutes="500 mins / month",
                    features=["750 free web service hours/mo (planned)", "Free SSL certificate (planned)", "Free PostgreSQL (1GB) (planned)", "Auto Git deploys (planned)"]
                ),
                ProviderTier(
                    tier_name="Starter (Paid) - Coming Soon",
                    cost_usd_month=7.0,
                    cost_inr_month=round(7.0 * USD_TO_INR),
                    bandwidth_gb="500 GB / month",
                    build_minutes="Unlimited",
                    features=["No spin-down / 0 cold start (planned)", "512MB RAM + 0.5 vCPU (planned)", "Persistent disk support (planned)", "Custom alert webhooks (planned)"]
                )
            ],
            deploy_badge="Coming Soon"
        ))

        # Sort: Netlify first (real), then Vercel (prototype), then Render (disabled)
        provider_order = {"netlify": 0, "vercel": 1, "render": 2}
        providers.sort(key=lambda p: provider_order.get(p.id, 99))
        return providers