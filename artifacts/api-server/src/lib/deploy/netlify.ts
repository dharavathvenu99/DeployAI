import { DeploymentError, type DeploymentLog } from "./types";

const NETLIFY_API = "https://api.netlify.com/api/v1";

type NetlifySite = { id: string; url?: string; ssl_url?: string; name?: string };
type NetlifyDeploy = { id: string; state?: string; ssl_url?: string; deploy_ssl_url?: string; url?: string; deploy_url?: string; error_message?: string };

function requireToken(): string {
  const token = process.env["NETLIFY_AUTH_TOKEN"];
  if (!token) throw new DeploymentError("MISSING_NETLIFY_TOKEN", "Netlify is not configured. Add NETLIFY_AUTH_TOKEN to the server secrets.", 503);
  return token;
}

async function netlifyRequest<T>(path: string, init: RequestInit): Promise<T> {
  const token = requireToken();
  let response: Response;
  try {
    response = await fetch(`${NETLIFY_API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...init.headers },
    });
  } catch {
    throw new DeploymentError("SITE_CREATION_FAILED", "Netlify could not be reached.", 502);
  }
  if (response.status === 429) throw new DeploymentError("NETLIFY_RATE_LIMIT", "Netlify rate limit reached. Try again in a moment.", 429);
  if (response.status === 401 || response.status === 403) throw new DeploymentError("NETLIFY_AUTH_FAILED", "Netlify rejected the server token.", 502);
  if (!response.ok) {
    let providerMessage = "";
    try {
      const body = await response.json() as { message?: string; error_message?: string };
      providerMessage = body.message ?? body.error_message ?? "";
    } catch {
      // The provider response was not JSON.
    }
    throw new DeploymentError("SITE_CREATION_FAILED", `Netlify request failed (${response.status})${providerMessage ? `: ${providerMessage}` : "."}`, 502);
  }
  return await response.json() as T;
}

export type NetlifyAdapter = {
  createSite: (projectName: string) => Promise<NetlifySite>;
  deployZip: (siteId: string, zip: Buffer) => Promise<NetlifyDeploy>;
  getDeploymentStatus: (deploymentId: string) => Promise<NetlifyDeploy>;
  runHealthCheck: (url: string) => Promise<{ httpStatus: number }>;
};

export function createNetlifyAdapter(healthCheck: (url: string) => Promise<{ httpStatus: number }>): NetlifyAdapter {
  return {
    createSite: async (projectName) => {
      const safeName = projectName.replace(/[^a-zA-Z0-9-]/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "launchpad-web";
      try {
        return await netlifyRequest<NetlifySite>("/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: `deployai-${safeName}-${Date.now().toString(36)}` }),
        });
      } catch (error) {
        if (error instanceof DeploymentError && error.code === "SITE_CREATION_FAILED") {
          throw error;
        }
        throw new DeploymentError("SITE_CREATION_FAILED", "Netlify could not create a site.", 502);
      }
    },
    deployZip: async (siteId, zip) => {
      try {
        return await netlifyRequest<NetlifyDeploy>(`/sites/${encodeURIComponent(siteId)}/deploys`, {
          method: "POST",
          headers: { "Content-Type": "application/zip" },
          body: new Uint8Array(zip),
        });
      } catch (error) {
        if (error instanceof DeploymentError) {
          if (error.code === "NETLIFY_RATE_LIMIT" || error.code === "NETLIFY_AUTH_FAILED") throw error;
          throw new DeploymentError("UPLOAD_FAILED", error.message, error.status);
        }
        throw new DeploymentError("UPLOAD_FAILED", "Netlify could not upload the deployment ZIP.", 502);
      }
    },
    getDeploymentStatus: async (deploymentId) => {
      try {
        return await netlifyRequest<NetlifyDeploy>(`/deploys/${encodeURIComponent(deploymentId)}`, { method: "GET" });
      } catch (error) {
        if (error instanceof DeploymentError) throw new DeploymentError("DEPLOYMENT_FAILED", error.message, error.status);
        throw error;
      }
    },
    runHealthCheck: healthCheck,
  };
}

export async function waitForNetlifyDeployment(
  adapter: NetlifyAdapter,
  deploymentId: string,
  logs: DeploymentLog[],
  timeoutMs = 60_000,
): Promise<NetlifyDeploy> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const deployment = await adapter.getDeploymentStatus(deploymentId);
    const state = deployment.state?.toLowerCase();
    logs.push({ timestamp: new Date().toISOString(), message: `Netlify deployment state: ${state ?? "unknown"}` });
    if (state === "ready") return deployment;
    if (state === "error" || state === "failed") {
      throw new DeploymentError("DEPLOYMENT_FAILED", deployment.error_message || "Netlify reported a deployment failure.", 502);
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new DeploymentError("DEPLOYMENT_TIMEOUT", "Netlify did not finish the deployment before the timeout.", 504);
}