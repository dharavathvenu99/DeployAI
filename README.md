# DeployAI

DeployAI is a mobile-first guided deployment experience. It analyzes a prepared static project, lets the user choose a provider, and can publish a validated static ZIP through a secure server-side Netlify adapter.

## Run locally

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/deploy-ai run dev
```

The managed Replit workflows start both services with the correct ports and proxy routing:

- Web app: `/`
- API: `/api`
- API health check: `/api/healthz`

Useful checks:

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/deploy-ai run typecheck
```

## Netlify setup

Add a Netlify personal access token as a Replit Secret named `NETLIFY_AUTH_TOKEN`. The API reads it only on the server when handling:

- `POST /api/deploy/netlify`
- `GET /api/deploy/health?url=https://...`

The deployment endpoint creates a Netlify site, uploads a server-prepared static ZIP, polls the deployment until it is ready, validates the returned HTTPS URL, and returns the real live URL. Prepared ZIPs are checked for existence, size, ZIP structure, safe paths, static file extensions, expansion limits, and a root `index.html`.

The generated sample project is a real interactive static app with a counter, task checklist, Running status badge, and deployment details, so opening the live URL visibly demonstrates that the deployment is executing.

The health endpoint accepts public HTTPS URLs only. It blocks local/private IPs, private DNS resolutions, credentials in URLs, redirects, and requests that exceed the timeout.

The token is never sent to the browser, placed in frontend code, committed to the repository, or written to logs.

## Demo Mode

**Try Demo** is intentionally offline. It never calls Netlify and displays:

> Demo mode: deployment simulated

The real deployment path is used for uploaded or connected sources after the user approves the Netlify launch.

Provider selection supports Netlify (connected), Vercel (prototype Demo Mode), and Render (disabled/coming soon). The user must explicitly choose a provider before continuing.

## API error behavior

The backend returns JSON with an `error` message and stable `code` for common failures, including:

- missing or rejected Netlify token
- invalid or unsafe ZIP
- Netlify rate limits
- site creation or upload failure
- deployment failure or timeout
- health-check failure or timeout

## Security boundaries

DeployAI does not execute commands from an uploaded project in this prototype. The current server prepares a known static artifact and only publishes ZIP content that passes the static deployment validator. Future provider adapters should preserve that boundary.