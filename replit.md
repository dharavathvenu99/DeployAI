# DeployAI

DeployAI guides users from project analysis to a secure static deployment and live URL.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (managed on port 8080 and proxied at `/api`)
- `pnpm --filter @workspace/deploy-ai run dev` — run the DeployAI web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required secret for real Netlify deploys: `NETLIFY_AUTH_TOKEN` — configure it through Replit Secrets; never place it in frontend code

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/deploy-ai/src/App.tsx` — mobile-first guided flow and Demo Mode/real deployment state
- `artifacts/api-server/src/routes/deploy.ts` — Netlify deployment and health-check routes
- `artifacts/api-server/src/lib/deploy/` — provider adapter, ZIP preparation, static safety validation, and deployment types
- `artifacts/api-server/src/routes/health.ts` — API liveness route

## Architecture decisions

- Demo Mode is offline by design and never contacts Netlify.
- Real deploys use a generic provider adapter boundary so another provider can be added without changing route responsibilities.
- The prototype publishes only a server-prepared validated static ZIP and never executes uploaded project commands.
- Health checks require public HTTPS and block private/local destinations and redirect responses.

## Product

Users can upload or connect a project, review AI-detected project details, explicitly choose a provider, approve a Netlify deployment, follow deployment stages, and open/copy a real healthy live URL. A separate sample flow simulates deployment without external calls.

Provider selection supports Netlify (connected), Vercel (prototype Demo Mode), and Render (disabled as coming soon).

## User preferences

Keep the experience mobile-first, preserve Demo Mode as an offline path, and do not expose provider credentials in browser code.

## Gotchas

- Use the managed API and web workflows; application requests should use relative `/api/...` paths.
- Test real deployment only after `NETLIFY_AUTH_TOKEN` is configured as a server secret.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
