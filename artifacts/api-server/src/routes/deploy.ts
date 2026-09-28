import { lookup } from "node:dns/promises";
import { Router, type IRouter } from "express";
import { join, resolve } from "node:path";
import { ensurePreparedDirectory, prepareStaticDeployment, validatePreparedZip } from "../lib/deploy/zip";
import { createNetlifyAdapter, waitForNetlifyDeployment } from "../lib/deploy/netlify";
import { DeploymentError } from "../lib/deploy/types";

const router: IRouter = Router();

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized === "localhost" || normalized === "::1" || normalized === "::" || normalized === "0.0.0.0") return true;
  if (normalized.includes(":")) return normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80") || normalized === "::1";
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(normalized)) return false;
  const octets = normalized.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => Number.isNaN(part))) return true;
  return octets[0] === 10 || octets[0] === 127 || octets[0] === 0 || (octets[0] === 169 && octets[1] === 254) || (octets[0] === 192 && octets[1] === 168) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31);
}

async function assertPublicHttpsUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new DeploymentError("HEALTH_CHECK_FAILED", "Health check URL is invalid.", 400);
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new DeploymentError("HEALTH_CHECK_FAILED", "Health checks require a public HTTPS URL.", 400);
  }
  if (isPrivateAddress(url.hostname)) throw new DeploymentError("HEALTH_CHECK_FAILED", `Health checks cannot target private or local addresses (${url.hostname}).`, 400);
  try {
    const addresses = await lookup(url.hostname, { all: true });
    const blockedAddress = addresses.find(({ address }) => isPrivateAddress(address))?.address;
    if (blockedAddress) throw new DeploymentError("HEALTH_CHECK_FAILED", `Health checks cannot target private or local addresses (${blockedAddress}).`, 400);
  } catch (error) {
    if (error instanceof DeploymentError) throw error;
    throw new DeploymentError("HEALTH_CHECK_FAILED", "Health check host could not be resolved.", 502);
  }
  return url;
}

async function runHealthCheckOnce(rawUrl: string): Promise<{ httpStatus: number }> {
  const url = await assertPublicHttpsUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "DeployAI-health-check/1.0" },
    });
    if (response.status < 200 || response.status >= 400) {
      throw new DeploymentError("HEALTH_CHECK_FAILED", `Health check returned HTTP ${response.status}.`, 502);
    }
    await response.body?.cancel();
    return { httpStatus: response.status };
  } catch (error) {
    if (error instanceof DeploymentError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new DeploymentError("HEALTH_CHECK_TIMEOUT", "Health check timed out after 10 seconds.", 504);
    throw new DeploymentError("HEALTH_CHECK_FAILED", "Live URL did not respond to the health check.", 502);
  } finally {
    clearTimeout(timer);
  }
}

async function runHealthCheck(rawUrl: string): Promise<{ httpStatus: number }> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await runHealthCheckOnce(rawUrl);
    } catch (error) {
      const isDnsPropagationError = error instanceof DeploymentError
        && error.code === "HEALTH_CHECK_FAILED"
        && error.message === "Health check host could not be resolved.";
      if (!isDnsPropagationError || attempt === 4) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }
  throw new DeploymentError("HEALTH_CHECK_TIMEOUT", "Health check timed out while waiting for DNS propagation.", 504);
}

function bodyString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

router.post("/deploy/netlify", async (req, res): Promise<void> => {
  const startedAt = Date.now();
  const projectName = bodyString(req.body?.projectName, "launchpad-web");
  const requestedZipPath = typeof req.body?.zipPath === "string" ? req.body.zipPath : undefined;
  const logs = [{ timestamp: new Date().toISOString(), message: "Preparing deployment" }];
  let cleanup: (() => Promise<void>) | undefined;

  try {
    if (!process.env["NETLIFY_AUTH_TOKEN"]) {
      throw new DeploymentError("MISSING_NETLIFY_TOKEN", "Netlify is not configured. Add NETLIFY_AUTH_TOKEN to the server secrets.", 503);
    }
    await ensurePreparedDirectory();
    let zipPath = requestedZipPath;
    if (!zipPath) {
      const prepared = await prepareStaticDeployment(projectName);
      zipPath = prepared.path;
      cleanup = prepared.cleanup;
    } else {
      const preparedRoot = resolve(process.env["DEPLOYAI_PREPARED_DIR"] ?? join(process.env["TMPDIR"] ?? "/tmp", "deployai-prepared"));
      if (!resolve(zipPath).startsWith(`${preparedRoot}/`)) {
        throw new DeploymentError("INVALID_ZIP", "Only server-prepared ZIP files can be deployed.", 400);
      }
    }
    const preparedZip = await validatePreparedZip(zipPath);
    logs.push({ timestamp: new Date().toISOString(), message: `Validated ${preparedZip.entries.length} static files (${preparedZip.size} bytes)` });
    const adapter = createNetlifyAdapter(runHealthCheck);
    logs.push({ timestamp: new Date().toISOString(), message: "Creating Netlify site" });
    const site = await adapter.createSite(projectName);
    logs.push({ timestamp: new Date().toISOString(), message: `Created Netlify site ${site.name ?? site.id}` });
    logs.push({ timestamp: new Date().toISOString(), message: "Uploading files" });
    const deployment = await adapter.deployZip(site.id, preparedZip.buffer);
    logs.push({ timestamp: new Date().toISOString(), message: "Waiting for Netlify" });
    const readyDeployment = await waitForNetlifyDeployment(adapter, deployment.id, logs);
    const liveUrl = site.ssl_url ?? site.url ?? readyDeployment.deploy_ssl_url ?? readyDeployment.ssl_url ?? readyDeployment.deploy_url ?? readyDeployment.url;
    if (!liveUrl) throw new DeploymentError("DEPLOYMENT_FAILED", "Netlify did not return a live URL.", 502);
    logs.push({ timestamp: new Date().toISOString(), message: "Deployment ready — waiting for client health check" });
    res.status(201).json({
      provider: "Netlify",
      providerId: "netlify",
      status: "ready",
      liveUrl,
      health: "pending",
      projectName,
      url: liveUrl,
      siteId: site.id,
      deploymentId: deployment.id,
      healthStatus: "Pending",
      httpStatus: null,
      buildTimeSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
      healthCheckedAt: null,
      logs,
    });
  } catch (error) {
    const deploymentError = error instanceof DeploymentError ? error : new DeploymentError("DEPLOYMENT_FAILED", "Deployment failed unexpectedly.", 500);
    req.log.error({ code: deploymentError.code, status: deploymentError.status }, deploymentError.message);
    res.status(deploymentError.status).json({ error: deploymentError.message, code: deploymentError.code });
  } finally {
    await cleanup?.();
  }
});

router.get("/deploy/health", async (req, res): Promise<void> => {
  const rawUrl = typeof req.query.url === "string" ? req.query.url : "";
  try {
    const health = await runHealthCheck(rawUrl);
    res.json({ status: "Healthy", httpStatus: health.httpStatus, url: rawUrl, checkedAt: new Date().toISOString() });
  } catch (error) {
    const deploymentError = error instanceof DeploymentError ? error : new DeploymentError("HEALTH_CHECK_FAILED", "Health check failed.", 502);
    req.log.warn({ code: deploymentError.code, status: deploymentError.status }, deploymentError.message);
    res.status(deploymentError.status).json({ error: deploymentError.message, code: deploymentError.code });
  }
});

export default router;