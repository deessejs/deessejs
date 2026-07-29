# `packages/api` — Internal structure

File-by-file contract. Each file has one responsibility. The modular contract and the clean separation of transports depend on this layout being respected.

## `src/`

### `src/core/`

Framework-agnostic procedures. The "what the API does" layer, independent of Hono or oRPC.

```
core/
├── <feature>/
│   ├── schemas.ts       # Zod input/output (single source of truth)
│   └── procedures.ts    # os.* builders; no transport concerns
```

**Rules:**

- A procedure is a function from `input → output`, declared with `os.input(...).output(...).handler(...)`.
- Procedures import data-access functions from `@deessejs/database/<feature>` and call them as `users.findById(ctx.db, ctx.orgId, ...)`. No direct `db.select()` calls. See [`../database/tenant-isolation.md`](../database/tenant-isolation.md).
- Schemas use Zod 4 (rationale in a forthcoming local ADR under `decisions/`).
- No imports from `orpc/`, `hono/`, or `middlewares/`.

### `src/context.ts`, `src/authorized.ts`, `src/public.ts` — the oRPC bases

Three root files that define the procedure builders used across `src/core/<feature>/`.

```
src/
├── context.ts          # os.$context<ApiBaseContext>() — initial context (per-request deps)
├── authorized.ts       # base.use(authMiddleware) — protected procedures (require session)
└── public.ts           # base — public procedures (no auth, for sign-up / sign-in / health probes / webhooks)
```

**Pattern (oRPC v1.14+).** The base is built from `os.$context<ApiBaseContext>()`, where `ApiBaseContext` carries the per-request dependencies (`headers`, `db`, `requestId`, `authContext`). `authorized` composes the base with `authMiddleware` (see [`src/middlewares/`](#srcmiddlewares--the-middleware-layer)). `public` is the raw base — used for sign-in endpoints, health probes, and webhooks (which authenticate via HMAC, not session).

**Example.**

```ts
// src/context.ts
import { os } from '@orpc/server'
import type { Database } from '@deessejs/database'

export interface ApiBaseContext {
  headers: Headers
  db: Database
  requestId: string
  authContext: { session: Session; user: User } | null
}

export const base = os.$context<ApiBaseContext>()
```

```ts
// src/authorized.ts
import { base } from './context'
import { authMiddleware } from './middlewares/auth'

export const authorized = base.use(authMiddleware)
```

Procedures then read like:

```ts
// src/core/users/procedures.ts
import { z } from 'zod'
import { authorized } from '../../authorized'
import * as users from '@deessejs/database/users'

export const getUser = authorized
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    return users.findById(context.db, context.orgId, input.id)
  })
```

**Why this split.**
- `public` and `authorized` make the auth requirement explicit at the type level (a `public` procedure cannot accidentally read `context.session`).
- The base is the single place where we define per-request dependencies. Adding a new dep (e.g. `cache`) is one line in `context.ts` and every procedure picks it up.
- `authMiddleware` is composable: we add a `requireOrg` middleware on top of `authorized` for org-scoped procedures.

### `src/orpc/`

oRPC RPCHandler setup. The internal transport for `apps/web`.

| File | Responsibility |
|---|---|
| `handler.ts` | `new RPCHandler(router, ...)` from `@orpc/server/fetch` (Fetch API Request/Response — not the Node variant). Configured with `CORSPlugin` and the `onError` interceptor. |
| `context.ts` | The **extended** oRPC context type — the initial context comes from `src/context.ts` (`os.$context<>()`); this file extends it with what the oRPC handler chain produces (e.g. `session`, `user`, `orgId`). |
| `mount.ts` | Hono middleware that wires `RPCHandler` at `/rpc/*` with the **body-parser proxy** (mandatory — Hono must not read the body before oRPC). The proxy forwards `arrayBuffer` / `blob` / `formData` / `json` / `text` to `c.req[prop]()`. |

### `src/hono/`

oRPC OpenAPIHandler setup. The public REST transport, plus the OpenAPI spec generator and the playground UI.

| File | Responsibility |
|---|---|
| `handler.ts` | `new OpenAPIHandler(router, ...)` from `@orpc/openapi/fetch`, filtered via `filter: ({ contract }) => !contract['~orpc'].route.tags?.includes('internal')` to exclude internal-only procedures. Configured with `OpenAPIReferencePlugin` (Scalar + spec endpoints — see `openapi.ts`). |
| `mount.ts` | Hono middleware that wires `OpenAPIHandler` at `/api/v1/*`. |
| `openapi.ts` | Configuration of the `OpenAPIReferencePlugin` (`@orpc/openapi/plugins`) and `ZodToJsonSchemaConverter` from **`@orpc/zod/zod4`** (NOT the legacy `@orpc/zod` — that's the Zod 3 path). The plugin auto-serves the spec at `/api/v1/spec.json` and the Scalar UI at `/api/v1/docs`. |
| ~~`scalar.ts`~~ | **Removed.** With `OpenAPIReferencePlugin({ docsProvider: 'scalar' })`, Scalar is auto-served at `docsPath` (default `/`, ours `/api/v1/docs`). No separate mount needed. |

### `src/middlewares/` — the middleware layer

All middlewares live here, organized by the layer they run at. Two sub-folders:

```
middlewares/
├── hono/    # Run BEFORE the route handler matches, at the Hono routing layer
└── orpc/    # Run INSIDE the procedure chain, composable via .use(...)
```

#### `src/middlewares/hono/` — the Hono middleware layer

Hono middlewares. Run **before** the route handler matches. **Generic only — no feature logic.**

| File | Responsibility |
|---|---|
| `request-id.ts` | Reads or generates `X-Request-Id`. Stores it on `c.get('requestId')`. |
| `auth-context.ts` | Creates the per-request Drizzle client (`createClient()`) and calls `auth.api.getSession` ONCE per request. Stashes the result on `c.get('authContext')`. The oRPC middleware reads it (no second `getSession` call). |
| `rate-limit.ts` | Upstash token bucket per `apiKeyId` and per `orgId`. Returns 429 with `Retry-After` before the route runs. |
| `cors.ts` | CORS for `/api/v1/*`. Configurable origin per buyer. |

> **Note on logging.** Sprint 1 uses Hono's built-in `logger()` middleware (from `hono/logger`), registered in `src/hono/app.ts`. It emits two colored lines per request (`<-- METHOD /path` and `--> METHOD /path STATUS DURATIONms`) — no per-request logger object in the context. For procedure-level logs, use the oRPC `onStart` / `onSuccess` / `onError` / `onFinish` hooks (re-exported from `middlewares/orpc/logger.ts`) with `console.log` / `console.error`. If we add a richer per-request logger later (pino, OTel spans), this file will host the init.

> **Note.** The session resolution for oRPC routes lives in `auth-context.ts` (Hono layer), not in an oRPC middleware — that way we call `getSession` exactly once per request, regardless of how many procedures run. The oRPC `authMiddleware` in `orpc/auth.ts` only validates that a session exists and propagates `session` + `user` into the oRPC context.

#### `src/middlewares/orpc/` — the oRPC middleware chain

oRPC middlewares (from `@orpc/server`). Run **inside** the procedure chain, composable via `.use(...)`.

| File | Responsibility |
|---|---|
| `auth.ts` | oRPC `authMiddleware` — reads `context.authContext` (set by the Hono `auth-context.ts`), throws `ORPCError('UNAUTHORIZED')` if missing, propagates `session` + `user` into the oRPC context. Used by `src/authorized.ts`. |
| `org-context.ts` | Reads `session.activeOrganizationId`, propagates `orgId` and `role` into the oRPC context. Composed on top of `authorized`. |
| `logger.ts` | Re-exports oRPC built-ins `onStart` / `onSuccess` / `onError` / `onFinish` for procedure-level instrumentation via `console.log` / `console.error`. |

### `src/errors/`

Error taxonomy and the `onError` interceptor that maps internal errors to the canonical wire format.

| File | Responsibility |
|---|---|
| `taxonomy.ts` | Error classes: `UnauthenticatedError`, `ForbiddenError`, `NotFoundError`, `ValidationError`, `RateLimitedError`, `ConflictError`, `InternalError`, `UpstreamUnavailableError`, `TimeoutError`. |
| `codes.ts` | The string codes (`unauthenticated`, `forbidden`, ...) bound to HTTP statuses. |
| `on-error.ts` | The oRPC `onError` interceptor. Maps oRPC errors to our taxonomy. |
| `serializer.ts` | Converts an error to the canonical wire shape `{ code, message, details?, requestId }`. |

### Top-level files

| File | Responsibility |
|---|---|
| `registry.ts` | The `FeatureApi` interface and the `createRegistry()` factory. Each feature module registers its procedures, routes, schemas, and events here. |
| `router.ts` | Composes the final oRPC router from the registry. |
| `app.ts` | Composes the final Hono app: Hono middleware (in order) → `/api/auth/*` → `/rpc/*` → `/api/v1/*` (which transparently serves `/api/v1/spec.json` and `/api/v1/docs` via `OpenAPIReferencePlugin`). **This is the export consumed by `apps/web` via `hono/vercel`'s `handle()` adapter.** See [`hosting.md`](./hosting.md) for the Next.js mount details. |
| `index.ts` | Public exports. Only what `apps/web` and the SDK generator import. |

## What gets consumed from outside

`packages/api` is consumed by **one consumer**: `apps/web` (the Next.js app). The interface is small:

- `import { app } from '@deessejs/api'` — the Hono app, mounted at `/api/[[...route]]/route.ts` via `hono/vercel`'s `handle()`.

That's it. No other package imports from `packages/api`. The dependency direction is `apps/web → packages/api → packages/{auth, database, ...}`.

For the SDK generator (which is a build-time tool, not a runtime consumer), the input is the OpenAPI spec produced at `/api/v1/spec.json` by the `OpenAPIReferencePlugin`. See [`hosting.md`](./hosting.md) for the hosting and build-time details.

## `tests/`

```
tests/
├── unit/                  # pure functions, no DB
├── integration/           # real Postgres + real Redis
├── contract/              # OpenAPI snapshot diff
├── delete/                # per-feature delete tests
└── helpers/
    ├── test-db.ts         # transactional rollback per test
    ├── test-redis.ts      # test-only Upstash namespace
    └── factories/         # per-entity data factories
```

## What goes where — quick reference

| You want to... | Edit |
|---|---|
| Add a new endpoint | `core/<feature>/schemas.ts` + `core/<feature>/procedures.ts` + register in `registry.ts` |
| Add a new Hono middleware | `middlewares/hono/<name>.ts` + add to `app.ts` composition |
| Add a new oRPC middleware | `middlewares/orpc/<name>.ts` + compose via `base.use(...)` in `authorized.ts` (or in the procedure file directly) |
| Add a new error type | `errors/taxonomy.ts` + `errors/codes.ts` |
| Change the OpenAPI spec generation | `hono/openapi.ts` |
| Change the SDK-facing types | `core/<feature>/schemas.ts` (single source of truth) |
| Document a local decision | `decisions/NNNN-<slug>.md` |
