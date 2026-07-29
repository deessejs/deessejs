# Hosting — Next.js mount + Vercel config

How `packages/api` is hosted in production. The Hono app is **consumed by `apps/web`** (Next.js App Router) and deployed as a single Vercel Function on **Vercel Fluid Compute**.

> **Runtime decision.** We run on **Node.js**, not Edge. The rationale is in [`decisions/0001-node-runtime-not-edge.md`](./decisions/0001-node-runtime-not-edge.md). This is non-negotiable for v1 (Drizzle postgres-js driver, Better Auth with all plugins, Trigger.dev all need Node).

## Deployment topology

```
Vercel Project (single Next.js app)
│
├── apps/web/                          Next.js App Router
│   ├── app/                           UI (React Server Components, pages)
│   ├── app/api/[[...route]]/          ← the Hono app is mounted here
│   │   └── route.ts                       (export const GET = handle(app))
│   └── next.config.mjs
│
├── packages/api                       Source of the Hono app
│   └── src/app.ts                     ← `export { app }` (Hono instance)
│
├── packages/database                  Used at runtime (Drizzle client)
├── packages/auth                      Used at runtime (Better Auth instance)
└── packages/storage                   Used at runtime (R2 client)
```

**One Vercel Function per deployment.** The whole stack lives in one Next.js app. The Hono app inside `packages/api` is just a module imported by `apps/web/app/api/[[...route]]/route.ts`. There are no microservices, no separate functions per feature.

## The Next.js mount

### The catch-all route

```ts
// apps/web/app/api/[[...route]]/route.ts
import { handle } from 'hono/vercel'
import { app } from '@deessejs/api'

// One export per HTTP method Hono supports.
// `handle(app)` adapts the Hono app to Next.js's Route Handler signature.
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)
```

The `[[...route]]` catch-all sends every request under `/api/*` to the Hono app. Inside the Hono app, the router matches the path:
- `/api/auth/*` → Better Auth handler
- `/rpc/*` → oRPC RPCHandler (web app)
- `/api/v1/*` → oRPC OpenAPIHandler (public REST)
- `/api/v1/openapi.json` → OpenAPI spec
- `/api/v1/docs` → Scalar UI

### The Hono app export (from `packages/api`)

```ts
// packages/api/src/app.ts
import { Hono } from 'hono'
import { requestIdMiddleware } from './middleware/request-id'
import { sessionMiddleware } from './middleware/auth-context'
import { authRoutes } from './hono/mount-auth'
import { orpcRoutes } from './hono/mount-rpc'
import { openApiRoutes } from './hono/mount-openapi'

const app = new Hono<{ Variables: AppVariables }>()

// Order matters:
// 1. request-id (so all subsequent logs have it)
// 2. session/auth-context (so routes have c.get('authContext'))
// 3. routes (which depend on the context)
app.use('*', requestIdMiddleware)
app.use('*', sessionMiddleware)
app.route('/', authRoutes)
app.route('/', orpcRoutes)
app.route('/', openApiRoutes)

export { app }
```

This is what `apps/web/app/api/[[...route]]/route.ts` imports.

### `maxDuration` on the route

```ts
// apps/web/app/api/[[...route]]/route.ts
export const maxDuration = 1800  // Pro / Ent GA ceiling since 2026-06-15 (Node/Python + Fluid Compute). > 1800s still beta.

export const GET = handle(app)
// ... etc
```

**1800s is the GA ceiling for Pro/Ent on Node.js/Python with Fluid Compute (since 2026-06-15).** 1800s is plenty for any synchronous API call, AI streaming, and admin operations. The > 1800s tier is still beta — Trigger.dev handles long jobs.

If a specific route needs more (rare), it can be **isolated** in its own folder + route file with its own `maxDuration`:

```ts
// apps/web/app/api/admin/migrate/route.ts (hypothetical)
export const maxDuration = 1800  // 30 min, beta

import { handle } from 'hono/vercel'
import { adminMigrateRoute } from '@deessejs/api/admin/migrate-route'

export const POST = handle(adminMigrateRoute)
```

This is the "function per route" pattern Vercel supports. We **default to the catch-all** and isolate only when needed.

## Vercel config

### `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "fluid": true,
  "functions": {
    "apps/web/app/api/[[...route]]/route.ts": {
      "maxDuration": 1800,
      "memory": 2048
    }
  }
}
```

- `"fluid": true` — explicit, even though it's the default for new projects. Makes the intent clear.
- `maxDuration: 1800` — matches the route-level setting. Belt-and-suspenders.
- `memory: 2048` — 2 GB. Default. The 4 GB option is for memory-heavy workloads (image processing, large AI contexts). We don't need it.

### Environment variables

Set in Vercel dashboard or via `vercel env` CLI:

| Variable | Scope | Required |
|---|---|---|
| `BETTER_AUTH_URL` | Production + preview | yes |
| `BETTER_AUTH_SECRET` | Production + preview | yes |
| `NEXT_PUBLIC_APP_URL` | Production + preview | yes |
| `PARENT_DOMAIN` | Production | for cross-subdomain cookies |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | All | for OAuth |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | All | for OAuth |
| `DATABASE_URL` | All | Postgres connection (Neon serverless driver recommended for Fluid Compute) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | All | Sessions, rate limit, API key cache |
| `RESEND_API_KEY` | All | Email delivery |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | All | Billing |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | All | Storage |
| `TRIGGER_DEV_SECRET_KEY` | All | Background jobs |
| `CRON_SECRET` | Production | For Vercel Cron (if used) |

The full list lives in `packages/auth/setup.md` (auth-specific) and in the buyer's `.env.example` (delivered with the template).

### CORS

CORS is handled **inside the Hono app** via `hono/cors` middleware, not at the Vercel routing layer. The middleware runs on every `/api/*` request. See `packages/auth/integrations.md` §1 for the exact pattern.

Vercel Routing Middleware (different layer) is for **rewrites, redirects, and header changes before any function runs**. We don't use it for CORS. We use it for:
- Rewriting legacy URLs (`/v1/old-path` → `/api/v1/new-path`).
- A/B testing cookies.
- Adding security headers at the edge before any code runs.

If we add those, they go in `apps/web/middleware.ts` (Next.js's middleware convention).

## Fluid Compute implications

We run on **Vercel Fluid Compute** (default since 2025-04-23). The implications for our architecture:

| Capability | What it means | How we use it |
|---|---|---|
| **Optimized concurrency** | One function instance serves multiple concurrent requests | Our API does heavy I/O (DB, Redis, Stripe). Fluid Compute shares the waits, costs less. |
| **Bytecode caching (Node 20+)** | First request compiles, subsequent are instant | Cold start ~10x faster. We pin Node 20+ in `package.json`. |
| **Active CPU billing** | Pay for CPU executing, not for I/O wait | Our pricing model is viable on Vercel Pro without exploding the bill. |
| **`waitUntil`** | Continue work after response | We use it for non-blocking audit log writes, event emission to Upstash Realtime, fire-and-forget analytics. |
| **Error isolation** | Uncaught errors don't crash the instance | Other concurrent requests on the same instance keep running. |
| **Multi-AZ failover** | HA in the same region | Free, automatic. |

**The "no idle billing" is the key economic lever.** A typical API request to our app: ~50ms of CPU, ~200ms of I/O wait. With traditional serverless, we pay for 250ms × 1 instance. With Fluid Compute, we pay for ~50ms × (shared instance).

## Vercel Functions limits we respect

From [Vercel's official limits page](https://vercel.com/docs/functions/limitations) (verified 2026-06-18):

| Limit | Value | What we do |
|---|---|---|
| **Memory (Node, Pro)** | 2 GB default, 4 GB max | Default is enough. We don't need 4 GB unless AI streaming gets heavy. |
| **Default duration** | 300s | 300s > any normal API call. Not a constraint. |
| **Max duration (GA, Pro, Node/Python + Fluid Compute)** | 1800s (30 min, since 2026-06-15) | Our `maxDuration` cap. |
| **Max duration (beta, Pro, Fluid, > 1800s)** | case-by-case | Not used. Trigger.dev handles long jobs. |
| **Bundle size (gzip)** | 250 MB | **The risk to monitor.** See §5. |
| **Request body** | 4.5 MB | JSON payloads are well under. File uploads go via R2 presigned URL — never through the function. |
| **Concurrency** | 30,000 (Pro) | Far above any single buyer's needs. |
| **File descriptors** | 1,024 shared | We use pooled connections (Drizzle + postgres-js pool). Within budget. |

## Bundle size — the risk to monitor

The 250 MB limit is the constraint. Our stack brings a lot of dependencies:

| Package | Approx size (gzip) |
|---|---|
| `next` | 80-100 MB |
| `hono` | < 1 MB |
| `@orpc/server` + `@orpc/client` + `@orpc/openapi` | < 2 MB |
| `drizzle-orm` | 5-10 MB |
| `better-auth` + plugins | 5-8 MB |
| `@better-auth/api-key` | 1 MB |
| `postgres` (postgres-js) | 5-10 MB (with native bindings) |
| `@neondatabase/serverless` (alternative driver, smaller) | 1 MB |
| Stripe SDK | 1-2 MB |
| Resend SDK | < 1 MB |
| AWS SDK (R2 is S3-compatible) | 5-10 MB |
| Trigger.dev SDK | 1-2 MB |
| Zod | 5-10 MB |
| **Total** | **~110-150 MB** (estimate) |

**We're under 250 MB but with limited headroom.** If we add a heavy client (e.g. an image processing lib), we cross the line.

**Mitigation strategies**, in order of preference:

1. **Modular contract** — each feature is tree-shakable. We can stop importing a feature's transitive deps if the feature is deleted.
2. **Driver choice** — `@neondatabase/serverless` (1 MB) instead of `postgres` (5-10 MB) for the production deploy. The Drizzle ORM is the same; the driver swaps.
3. **Adapters** — wrap the Stripe SDK, R2 SDK, Resend SDK in thin internal adapters. The buyer gets the full SDK in their `package.json` (because they might want to use it directly), but our code only imports the adapter.
4. **Function-per-route split** — if we exceed 200 MB, split the catch-all into multiple functions (one per major route group: `/api/auth`, `/rpc`, `/api/v1`). Each function has its own bundle.

**When to act** : if the production build produces a bundle > 200 MB, we split. For now, we ship the catch-all.

**How to measure** : after `pnpm build` in `apps/web`, check the `.next/server` directory. Vercel reports the upload size in the deploy logs. The CI build also reports the bundle size.

## Request body limit (4.5 MB)

**The API never receives a full file.** The flow for file uploads (R2):

1. Client calls `POST /api/v1/files/presign` with `{ filename, mimeType, size }`.
2. Our API validates the request, generates a presigned R2 URL with constraints (max size, mime type, expiry 5 min), returns `{ url, fileId }`.
3. Client uploads directly to R2 via the presigned URL. The file never touches our function.
4. Client calls `POST /api/v1/files/confirm` with `{ fileId }`.
5. Our API verifies the object exists in R2 (HEAD request), validates size + mime, creates the DB entry.

**JSON bodies** are well under 4.5 MB. The largest legitimate JSON body is a batch operation (e.g. "delete 1000 items") — we chunk those to < 1000 items per call, which is < 1 MB.

If a request exceeds 4.5 MB, Vercel returns 413 `FUNCTION_PAYLOAD_TOO_LARGE`. We document this in the API surface as a possible error.

## Observability — built-in

**Vercel Observability** tracks automatically:

- Invocation counts, error rates, p50/p95/p99 duration per route
- Cold start frequency
- Outgoing requests to DB, Stripe, Resend, etc.
- Function logs (stdout)

**No setup.** Open the Observability page in the Vercel dashboard to see it. On **Observability Plus** (Pro add-on), we get longer retention and per-path latency breakdown.

**Our log strategy** complements this:
- Hono's built-in `logger()` middleware emits two colored lines per request (`<-- METHOD /path` + `--> METHOD /path STATUS DURATIONms`). ANSI in dev, plain text in prod (set `NO_COLOR=1` on Vercel). No custom per-request logger object.
- oRPC `onError` interceptor (in `src/errors/on-error.ts`) writes procedure errors to `console.error`. For procedure-level instrumentation (start/end/duration), use the oRPC `onStart` / `onSuccess` / `onFinish` hooks re-exported from `packages/api/middlewares/orpc/logger`.
- For real-time alerting, we ship to **Upstash Redis** or an external log sink (Datadog, Honeycomb) — but not in v1.

**Tracing** (OpenTelemetry) is OTel-compatible (`ctx.trace` in our context), but no backend in v1. If a buyer wants tracing, they wire Langfuse or Tempo themselves.

## Local development

The buyer runs `pnpm dev` in `apps/web`:
- Next.js dev server starts on `localhost:3000`
- The Hono app is mounted at `/api/*` (via the same `route.ts` file)
- Better Auth, Drizzle, all the packages work in dev mode
- `vercel dev` is the alternative for testing Vercel-specific behavior (cron, Fluid Compute config), but it's not required for day-to-day dev

## Production deployment

**Via Git** (the recommended path):
1. Push to `main` (or merge a PR).
2. Vercel detects the push, builds the app, runs checks, deploys.
3. Preview deploys are created for every PR.
4. The buyer's CI (GitHub Actions) runs `pnpm test` + delete tests + the bundle size check before merge. If they pass, the Vercel deploy proceeds.

**Via CLI** (one-off):
```bash
vercel --prod  # from the project root
```

## What goes where — quick reference

| You want to... | Edit |
|---|---|
| Change `maxDuration` | `apps/web/app/api/[[...route]]/route.ts` (route-level) + `vercel.json` (belt-and-suspenders) |
| Enable Fluid Compute | `vercel.json` (`"fluid": true`); default ON for new projects |
| Add a new environment variable | Vercel dashboard + `.env.example` in the buyer-facing project |
| Add a new route to the Hono app | `packages/api/src/hono/mount-*.ts` — no change to the Vercel config needed |
| Add a new Vercel Function (per-route split) | Create a new folder under `apps/web/app/api/<group>/route.ts` + add to `vercel.json` `functions` |
| Measure bundle size | `pnpm build` + check `.next/server` size + Vercel deploy logs |
| Debug a 504 (timeout) | Check the route's `maxDuration`, the procedure's I/O pattern, the DB query time |
| Debug a 413 (payload too large) | Confirm the client isn't uploading a file through the function. Use presigned R2 URLs. |

## Cross-references

- [`decisions/0001-node-runtime-not-edge.md`](./decisions/0001-node-runtime-not-edge.md) — the runtime choice and its rationale
- [`../../12-apps/web/`](../../12-apps/web/) (TODO) — the `apps/web` package, which does the actual mount. Not yet scaffolded (2026-06-19).
- [`../auth/integrations.md`](../auth/integrations.md) — the Hono + Better Auth + Drizzle integration (this doc assumes it)
- [`../database/README.md`](../database/README.md) — the Drizzle client setup
- [Vercel — Functions limits](https://vercel.com/docs/functions/limitations) — official
- [Vercel — Fluid compute](https://vercel.com/docs/fluid-compute) — official
- [Vercel — 30 min changelog (2026-06-15)](https://vercel.com/changelog/vercel-functions-can-now-run-up-to-30-minutes) — the changelog that bumped Node/Python + Fluid Compute GA from 800s to 1800s. Reflected in this doc 2026-06-19.
- [Hono — Next.js integration](https://hono.dev/docs/getting-started/nextjs) — official
- [Hono — Vercel integration](https://hono.dev/docs/getting-started/vercel) — official
- [Vercel KB — Ship a Hono app on Vercel](https://vercel.com/kb/guide/ship-a-hono-app-on-vercel) — the canonical guide
