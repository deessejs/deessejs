# `@deessejs/*` Packages — Code Review

**Date:** 2026-06-22
**Scope:** `apps/template/packages/` (14 packages) + workspace root (`apps/template/`)
**Author:** Claude Code (technical-lead sub-agent)
**Goal:** Establish ground truth on the implementation state, dependency graph, tech stack, and architectural gaps of the DeesseJS template monorepo.

---

## 0. Workspace root snapshot

`apps/template/` is a self-contained pnpm workspace (file: `apps/template/pnpm-workspace.yaml`):

```yaml
packages:
  - 'apps/web'
  - 'apps/cli'
  - 'apps/docs'
  - 'packages/*'
```

- **Root package.json:** `name: deessejs-template-root`, `private: true`, `type: module`, `packageManager: pnpm@9.15.0`, `engines.node: >=20`. Almost no scripts at the root.
- **`tsconfig.base.json`** is the shared TypeScript config: ES2022 target, ESNext modules, `Bundler` resolution, `strict: true`, `verbatimModuleSyntax: true`. Each package extends it.
- **No `turbo.json` at this level** — there is one at the monorepo root (`/turbo.json`), but the template is set up as a *nested* pnpm workspace. Each package has its own `pnpm typecheck`, `pnpm test` (vitest), and `pnpm build` (`tsc`).
- **Apps in scope:** `apps/web` (Next.js, has real source), `apps/cli` (empty), `apps/docs` (empty). Only `apps/web` consumes the packages today.
- **Architecture docs:** `documents/internal/architecture/11-packages/` exists with READMEs for `api/`, `auth/`, `cache/`, `database/`. The other 10 packages have NO docs yet.

---

## 1. Per-package analysis

### 1.1 `@deessejs/api` — the API surface (IMPLEMENTED, SPRINT 1)

**Location:** `apps/template/packages/api/`

**Purpose.** Single source of truth for the runtime API. Wraps business logic behind two interchangeable transports — oRPC `RPCHandler` at `/rpc/*` (internal type-safe calls from `apps/web`) and `OpenAPIHandler` at `/api/v1/*` (public REST consumed by the SDK, CLI, and third-party integrations). Better Auth mounts separately at `/api/auth/*`.

**Public exports (from `src/index.ts`):**
- `app` — the Hono app (mounted by `apps/web` via `hono/vercel`).
- `router` — the oRPC router (used by spec generation and the type-safe client).
- Procedure builders: `base`, `publicProcedure`, `sessionOnly`, `authorized`.
- Hono middlewares: `requestIdMiddleware`, `authContextMiddleware`, `rateLimitMiddleware`, `apiCorsMiddleware`.
- oRPC middlewares: `authMiddleware`, `orgContextMiddleware`, plus re-exports of `onStart` / `onSuccess` / `onError` / `onFinish`.
- `ORPCError` (re-exported from `@orpc/server`), `WireError`, `WireErrorCode` types.
- Type `AppVariables` (Hono `Variables` shape).

**Internal layout (`src/`):**
- `context.ts` — `os.$context<ApiBaseContext>()` base builder. `ApiBaseContext` carries `headers`, `db`, `requestId`, `authContext`, `activeOrg`.
- `authorized.ts` — composes `base.use(authMiddleware).use(orgContextMiddleware)` into `authorized`.
- `public.ts` — `publicProcedure = base` (alias for clarity).
- `request-context.ts` — `AsyncLocalStorage<{ requestId }>` instance. Reads work outside the Hono middleware chain (the oRPC `customErrorResponseBodyEncoder` reads from it).
- `hono/app.ts` — composes the middleware chain: `requestId` → `authContext` → `rateLimit` (stub) → `logger()` → routes for `/api/auth/*`, `/rpc/*`, `/api/v1/*`.
- `hono/mount-rpc.ts` — wires `RPCHandler` at `/rpc/*` with the **body-parser proxy** (mandatory to avoid Hono reading the body before oRPC).
- `hono/mount-openapi.ts` — wires `OpenAPIHandler` at `/api/v1/*`. Filter excludes procedures tagged `internal`.
- `hono/mount-auth.ts` — Better Auth handler mounted at `/api/auth/*` with permissive CORS (localhost + vercel.app + buyer origin).
- `hono/openapi.ts` — `OpenAPIReferencePlugin` config (Scalar UI at `/api/v1/docs`, spec at `/api/v1/spec.json`) + the `customErrorResponseBodyEncoder` that reads requestId from AsyncLocalStorage.
- `hono/context.ts` — `buildOrpcContext(c)` helper. Single edit site if `ApiBaseContext` grows.
- `middlewares/hono/auth-context.ts` — **the load-bearing middleware**. Single `auth.api.getSession({ headers, asResponse: true })` call per request. Propagates `set-cookie` back. Resolves active org + member role via Better Auth's documented `getFullOrganization` + `getActiveMemberRole`. Graceful degradation: errors swallow to `authContext = null`.
- `middlewares/hono/auth-client.ts` — typed accessor that **casts `auth.api` to a structural subset** because the Better Auth re-export loses the `Options["plugins"]` generic in 1.6.19 (Better Auth issue #4222). One file, two methods, one cast.
- `middlewares/hono/request-id.ts` — reads or generates `X-Request-Id`, wraps the rest of the request in `requestContext` ALS scope.
- `middlewares/hono/rate-limit.ts` — **STUB.** Logs a one-time WARN at first hit outside tests. Plan documented (Upstash token bucket per `apiKeyId` + per `orgId`) but not implemented.
- `middlewares/hono/cors.ts` — origin policy: buyer origin + `*.vercel.app` + localhost.
- `middlewares/orpc/auth.ts` — reads `context.authContext`, throws `ORPCError('UNAUTHORIZED')` if null, propagates `session` + `user`.
- `middlewares/orpc/org-context.ts` — reads `context.activeOrg`, throws `FORBIDDEN` with `{ data: { reason: 'no_active_org' } }` if missing, propagates `orgId`, `orgSlug`, `orgMemberRole`.
- `middlewares/orpc/logger.ts` — re-exports oRPC hooks (`onStart`, `onSuccess`, `onError`, `onFinish`).
- `errors/codes.ts` — wire codes: `unauthenticated`, `forbidden`, `not_found`, `validation_error`, `rate_limited`, `conflict`, `internal_error`, `upstream_unavailable`, `timeout`. `orpcCodeToWireCode()` maps oRPC codes → wire codes.
- `errors/taxonomy.ts` — `export { ORPCError } from '@orpc/server'` — no custom hierarchy. Documented why.
- `errors/serializer.ts` — `serializeOrpcError(error, requestId)` returns `{ code, message, details?, requestId }`. Unknown errors become `internal_error` with NO message (no internals leak).
- `errors/log.ts` — `logOrpcError(error)` server-side log via `console.error`.
- `router.ts` — single oRPC router. **Three placeholder procedures today:** `ping` (public), `pingAuth` (sessionOnly), `pingOrg` (authorized). Documented as Sprint-1 wiring tests.

**Key dependencies (internal):** `@deessejs/auth` (workspace), `@deessejs/database` (workspace).
**External:** `@orpc/server` ^1.14.0, `@orpc/client` ^1.14.0, `@orpc/openapi` ^1.14.0, `@orpc/zod` ^1.14.0, `hono` ^4.6.0, `zod` ^4.0.0. Dev: vitest ^2.1.0, eslint ^9, typescript-eslint ^8.61.1.

**Notable patterns.**
- **Single `getSession` call per request.** Hono middleware populates `authContext`, oRPC middleware just validates it. No double fetch.
- **`asResponse: true` cookieCache workaround.** Documented as a divergence from Better Auth's official Hono integration guide. Tracked for cleanup when Better Auth PR #9667 merges.
- **AsyncLocalStorage for `requestId`.** Solves the "encoder called outside middleware chain" problem; same pattern oRPC's experimental pino integration uses.
- **Per-mount `onError` interceptor** logs server-side; per-handler `customErrorResponseBodyEncoder` reshapes the public wire format.
- **ESLint `no-restricted-imports`** blocks `drizzle-orm` and `@deessejs/database/schema` in `src/core/**` and `src/middlewares/orpc/**`. Enforces the tenant-isolation rule from the data-access pattern.
- **No `core/` directory yet.** Documented as the M1 target: per-feature `procedures.ts` + `schemas.ts` + a registry.

**Implementation state.** Sprint 1 wiring is complete and tested. The package is **functionally complete as a skeleton** — Hono boots, both transports respond, error mapping works end-to-end, the org-context chain is wired with unit tests. What it lacks is real procedures (only `ping`/`pingAuth`/`pingOrg` placeholders), rate limiting, and the `core/` modular layout.

**Tests.**
- `tests/integration/smoke.test.ts` — boots the Hono app via `app.request()`, hits `/rpc/ping`, `/api/v1/ping`, `/api/v1/spec.json`, `/api/v1/docs`, `/api/auth/get-session`. Asserts oRPC envelope shape (`{ json: ... }`) vs OpenAPI native JSON, the spec has `openapi: 3.x` and `info.title = DeesseJS API`, Scalar UI HTML, Better Auth 1.6.19's renamed `/get-session` endpoint.
- `tests/integration/failure-paths.test.ts` — exercises `UNAUTHORIZED` and `FORBIDDEN` paths. Asserts wire shape `{ code: "unauthenticated", message, requestId }` (UUID format), the FORBIDDEN `data: { reason: 'no_active_org' }` payload, the happy path through `orgContextMiddleware` and `authMiddleware`, and graceful degradation when `getSession` throws.

---

### 1.2 `@deessejs/auth` — Better Auth wiring (IMPLEMENTED, SPRINT 1)

**Location:** `apps/template/packages/auth/`

**Purpose.** Configure the Better Auth instance with all plugins enabled for Sprint 1: email/password (with verification), magic link, email OTP, OAuth (Google + GitHub), multi-tenant orgs with RBAC, admin + impersonation, API keys (with `sk_live_` prefix), 2FA TOTP, WebAuthn passkeys. Exposes the configured `auth` instance + inferred `Auth`/`Session`/`User` types + the RBAC access-control matrix.

**Public exports (from `src/index.ts`):**
- `auth` — the configured Better Auth instance (cast to public `Auth` type).
- Types: `Auth`, `Session`, `User` (all inferred via `Auth['$Infer']`).
- `ac`, `owner`, `admin`, `member`, `billing` — access control instance and roles.
- `STATEMENTS` — the RBAC permission matrix.

**Internal layout (`src/`):**
- `auth.ts` — the production instance. Heavy comments on every option. Email/password, magic link, email OTP senders are **console.log placeholders** (the mail package will replace them). `secondaryStorage` is a placeholder (real wiring with `@upstash/redis` is M1). Plugins: `organization({ ac, roles, allowUserToCreateOrganization })`, `admin({ defaultRole: 'member', adminRoles: ['admin'] })`, `apiKey({ defaultPrefix: 'sk_live_', enableMetadata, enableSessionForAPIKeys, rateLimit: 100/min })`, `twoFactor({ issuer: 'DeesseJS' })`, `passkey({ rpName, rpID, origin })`.
- `access-control.ts` — `createAccessControl(statement)` with statements `{ ...defaultStatements, project: [create/read/update/delete], billing: [read/update] }`. Roles: `owner` (everything), `admin` (no org deletion/ownership transfer), `member` (read-only on org info, `project: ['read']`), `billing` (read-only on org info + `billing: [read, update]`).
- `auth.test.ts` — **a separate test-only instance** (excluded from the prod build). Uses `PGlite` (in-memory Postgres via WASM) instead of `postgres-js`. Boots `migrate()` from `packages/database/src/migrations`. Uses the `testUtils` Better Auth plugin (factories, DB helpers, auth helpers, OTP capture). Same RBAC matrix, simplified config (no cross-subdomain cookies, no rate limit, deterministic secret, no real OAuth).

**Key dependencies (internal):** `@deessejs/database` (workspace) — for the Drizzle schema namespace + `createClient`.
**External:** `better-auth` 1.6.19, `@better-auth/api-key` 1.6.19, `@better-auth/drizzle-adapter` 1.6.19, `@better-auth/passkey` 1.6.11. Dev: `@better-auth/test-utils` 1.6.9, vitest ^2.1.0, `@electric-sql/pglite`.

**Notable patterns.**
- **Type cast: `_auth as unknown as Auth`.** The inferred type leaks `@simplewebauthn/server` internal paths via the passkey plugin. Documented.
- **Better Auth CLI scripts:** `pnpm auth:generate` (regenerates `packages/database/src/schema/auth/index.ts`), `pnpm auth:info`, `pnpm auth:secret`. The generated schema file is 280 lines covering `users`, `sessions`, `accounts`, `verifications`, `organizations`, `members`, `invitations`, `twoFactor`, `jwks`, `apikeys`, `passkeys`, plus all per-table relations.
- **`usePlural: true`** on the adapter — naming convention.
- **`storeSessionInDatabase: true`** — required for revocation (cookieCache alone is revocable on the client but not server-side).
- **Cookie cache: enabled, 5-minute TTL**, refreshed via the `asResponse: true` workaround documented in `packages/api`.
- **Cross-subdomain cookies enabled** for production (`PARENT_DOMAIN` env).
- **`trustedOrigins`** pulled from `NEXT_PUBLIC_APP_URL`.
- **Rate limit per endpoint** (sign-in: 5/min, sign-up: 3/min, 2FA verify: 5/min, forget-password: 3/min), backed by `secondaryStorage` (Upstash — currently a stub).

**Implementation state.** Complete for Sprint 1. The schema is auto-generated and committed. Email senders are `console.log` placeholders to be replaced by the `mail` package. `secondaryStorage` is a no-op — explicitly flagged as M1 work (it blocks both auth rate limiting and the API package's rate-limit middleware).

**Tests.**
- `tests/integration/auth.test.ts` — exercises the Better Auth `testUtils` plugin: `createUser`/`saveUser`/`deleteUser`, `createOrganization`/`saveOrganization`/`addMember`, `login` (returns `{ user, session, headers, cookies, token }`), `getCookies` (Playwright/Puppeteer-compatible shape), `getAuthHeaders`, `getSession` happy + null paths, `clearOTPs`.
- **OTP tests are SKIPPED** with a TODO note: Better Auth 1.6.19 renamed `auth.api.sendVerificationOTP` to something else (likely `auth.api.signInEmailOTP`). Needs verification before re-enabling.

---

### 1.3 `@deessejs/cache` — Redis abstraction (IMPLEMENTED, SPRINT 1)

**Location:** `apps/template/packages/cache/`

**Purpose.** Thin abstraction over `@upstash/redis` with auto-detect between Upstash (prod) and an in-memory implementation (dev + tests). Provides a typed key builder that enforces a `{domain}:{entity}:{id}` convention and supports multi-tenant keying (`{domain}:{entity}:org_{orgId}:{id}`).

**Public exports (from `src/index.ts`):**
- `createRedisClient` factory + `CreateRedisClientOptions` type.
- `key` — frozen key builder with builders for: `session`, `otpCounter`, `rateLimitIp`, `apiKey` (single-tenant); `orgSession`, `orgApiKey`, `orgCache`, `orgRateLimit`, `apiKeyRateLimit` (multi-tenant).
- `MemoryRedisClient` class.
- `RedisLike` structural interface + `Redis` (re-export from Upstash).
- `isMemoryClient` — type guard.

**Internal layout (`src/`):**
- `types.ts` — `RedisLike` interface (5 required methods: `get`, `set`, `del`; 3 optional: `expire`, `scan`, `keys`). Documents why a structural type (Upstash's class has ~50 methods; we consume 5–7).
- `clients/client.ts` — `createRedisClient({ force? })`. Auto-detects via `UPSTASH_REDIS_REST_URL` env. Throws if `force: 'upstash'` but env is missing — no silent fallback.
- `clients/memory.ts` — `MemoryRedisClient` class. JSON-serialized storage, separate `expiresAt` Map, lazy expiry on read, no background sweeper, custom `clear()`/`size()` test methods. Includes `globToRegex()` for SCAN/KEYS pattern matching (handles `*` and `?`, escapes regex metacharacters; does NOT support `[abc]` or escapes — documented limit).
- `clients/is-memory-client.ts` — `instanceof` check type guard.
- `keys/index.ts` — the frozen `key` builder. Documented convention: tenant in the MIDDLE of multi-tenant keys (not the start) so `redis-cli MONITOR` shows which package is hitting Redis.

**Key dependencies (internal):** none.
**External:** `@upstash/redis` ^1.34.0. Dev: vitest, eslint, typescript-eslint.

**Notable patterns.**
- **Structural `RedisLike` interface** — `MemoryRedisClient` doesn't extend `Redis`, just `implements RedisLike`. The Upstash cast is `as unknown as RedisLike` (runtime is correct; type system would otherwise force implementing 50 methods).
- **`Object.freeze(key)`** + `Readonly<typeof key>` type — mutations caught at compile time.
- **`force: 'memory'` is the escape hatch** for tests that want memory even with env vars set.

**Implementation state.** Complete. Three test files: `client.test.ts` (factory behavior — auto-detect, force options, type guard, end-to-end round-trip), `keys.test.ts` (key builders), `memory-client.test.ts` (memory backend). All passing.

**Notable.** The cache package is consumed by no other package today (despite being declared as a dependency of nothing). It's standalone infrastructure, ready for the `auth.secondaryStorage` wiring (M1) and the API rate-limit middleware (M1).

---

### 1.4 `@deessejs/database` — Drizzle + Postgres (IMPLEMENTED, SPRINT 1)

**Location:** `apps/template/packages/database/`

**Purpose.** Postgres connection factory (Drizzle ORM + `postgres-js` in prod, PGlite in tests), env validation (Zod), transaction retry helper, schema namespace. The schema is generated by Better Auth's CLI and committed. **No feature modules yet** — that's M1.

**Public exports (from `src/index.ts`):**
- `createClient`, `Database` type, `CreateClientOptions`.
- `loadEnv`, `Env` type.
- `withSerializableRetry` — retries on Postgres `40001` (serialization failure).
- `schema` namespace — `import { users, organizations, ... } from '@deessejs/database'`.
- `OrgId`, `UserId` — branded ID types.

**Internal layout (`src/`):**
- `client/index.ts` — `drizzle(env.DATABASE_URL, { schema })` (postgres-js). Return type is `Database`. Single sanctioned factory. **Has a TODO** to re-add explicit pool config (`max`, `idle_timeout`, `prepare`) if pool exhaustion is measured under Vercel Fluid Compute load.
- `client/env.ts` — Zod schema: `DATABASE_URL` (URL), `NODE_ENV` (enum, default `development`), `LOG_LEVEL` (enum, default `info`), `VERCEL` (optional). `loadEnv()` validates explicitly (not at module load) so tests can pass custom env.
- `transactions/index.ts` — `withSerializableRetry(fn, { maxAttempts = 3, baseDelayMs = 10 })`. Exponential backoff with jitter. Only retries `40001`; other errors propagate. Documents the idempotency requirement for retried transactions.
- `schema/index.ts` — assembles the `schema` namespace from `./auth` (the only feature today).
- `schema/_columns.ts` — `OrgId`/`UserId` branded types, `orgIdColumn()`, `timestampColumns()` (`createdAt` + `updatedAt` with `$onUpdate`), `softDeleteColumn()`. Documents why FKs to `orgs` are per-table, not here (forward reference would be circular).
- `schema/auth/index.ts` — **280 lines of generated Drizzle schema** covering `users`, `sessions`, `accounts`, `verifications`, `organizations`, `members`, `invitations`, `twoFactor`, `jwks`, `apikeys`, `passkeys`, plus per-table `relations()`. This is the full Better Auth schema with `usePlural` naming.
- `migrations/0000_famous_red_ghost.sql` — **153 lines of generated SQL**, the initial migration. `meta/` directory for Drizzle journal.

**Key dependencies (internal):** none.
**External:** `drizzle-orm` ^0.45.2, `postgres` ^3.4.5, `zod` ^4.0.0. Dev: `@electric-sql/pglite` ^0.5.3, `drizzle-kit` ^0.30.1, vitest ^2.1.0.

**Drizzle config (`drizzle.config.ts`):** `dialect: 'postgresql'`, schema `./src/schema/index.ts`, out `./src/migrations`. `strict: true`, verbose in dev, `entities.roles: false` (Better Auth manages roles, not drizzle-kit).

**Tests.**
- `tests/helpers/test-db.ts` — `setupTestDb()` returns `{ db, sql, orgA, orgB, close }`. Uses PGlite (in-memory). Two pre-generated org IDs for cross-tenant tests.
- `tests/integration/_pattern/cross-tenant.test.ts` — pattern demonstration. Defines a fixture `test_items` table inline (test fixture, NOT in `src/schema/`), inserts two items with different org IDs, asserts that `WHERE orgId = X` returns only X's items, asserts that the unfiltered query returns both (documents the failure mode). This is the template every future org-scoped feature follows.

**Notable patterns.**
- **PGlite for tests, postgres-js for prod.** Real Postgres semantics in tests, zero install.
- **`vitest.config.ts`** hardcodes env (`NODE_ENV: 'test'`, placeholder `DATABASE_URL`) because Vitest's auto `.env.test` loading has CWD quirks.
- **Pool: `forks`, `singleFork: true`** — serial execution, one test file at a time, against a shared DB.
- **Test timeout 30s** — DB tests can be slow.

**Implementation state.** Schema is complete (Better Auth generated). Migrations are committed and applied by `auth.test.ts`. The package has no feature modules yet (`src/users.ts`, `src/projects.ts`, etc.) — that's the bulk of M1 work. The `withSerializableRetry` helper is ready but unused. The branded ID types and column builders are ready for feature authors.

---

### 1.5 `@deessejs/admin` — admin UI (EMPTY SKELETON)

**Location:** `apps/template/packages/admin/`
**Contents:** empty directory. No `package.json`, no `src/`, no tests.

**Implementation state.** Empty. Not bootstrapped. No consumers can import it yet.

---

### 1.6 `@deessejs/ai` — AI / LLM integration (EMPTY SKELETON)

**Location:** `apps/template/packages/ai/`
**Contents:** empty directory.

**Implementation state.** Empty. Likely the home for Claude / OpenAI / Vercel AI SDK integration, multi-provider abstraction, prompt templates. Nothing here yet.

---

### 1.7 `@deessejs/i18n` — internationalization (EMPTY SKELETON)

**Location:** `apps/template/packages/i18n/`
**Contents:** empty directory.

**Implementation state.** Empty. The architecture docs reference i18n concerns (multi-locale, locale-aware date formatting) but the package is not bootstrapped.

---

### 1.8 `@deessejs/logs` — structured logging (EMPTY SKELETON)

**Location:** `apps/template/packages/logs/`
**Contents:** empty directory.

**Implementation state.** Empty. Today, every package uses `console.log` / `console.error` directly. The API package's `errors/log.ts` is a placeholder. The Hono app uses Hono's built-in `logger()` for access logs. **This is a gap** — there's no structured logger (pino), no OTel spans, no PII redaction, no request-scoped logger propagated through context.

---

### 1.9 `@deessejs/mail` — transactional email (EMPTY SKELETON)

**Location:** `apps/template/packages/mail/`
**Contents:** empty directory.

**Implementation state.** Empty. Today, the `auth` package's `sendResetPassword`, `sendVerificationEmail`, `sendMagicLink`, and `sendVerificationOTP` are all `console.log` placeholders. The likely implementation is the Resend adapter (mentioned in the `auth.ts` comments).

---

### 1.10 `@deessejs/notifications` — user-facing notifications (EMPTY SKELETON)

**Location:** `apps/template/packages/notifications/`
**Contents:** empty directory.

**Implementation state.** Empty. Likely the home for in-app notifications (db-backed feed, real-time via SSE/WebSocket). Distinguishes from `mail` (transactional email) and `logs` (system logs).

---

### 1.11 `@deessejs/sdk` — generated client SDK (EMPTY SKELETON)

**Location:** `apps/template/packages/sdk/`
**Contents:** empty directory.

**Implementation state.** Empty. The API package exposes `/api/v1/spec.json` and a Scalar UI at `/api/v1/docs`. The architecture documents the SDK generator (likely `@orpc/client` + an OpenAPI client generator) but the package itself is not bootstrapped. This is the consumer surface for the CLI and third-party buyers.

---

### 1.12 `@deessejs/storage` — blob / object storage (EMPTY SKELETON)

**Location:** `apps/template/packages/storage/`
**Contents:** empty directory.

**Implementation state.** Empty. Likely the home for S3/R2 blob storage adapters (uploads, presigned URLs, CDN). Not referenced by any implemented code today.

---

### 1.13 `@deessejs/ui` — shared component library (EMPTY SKELETON)

**Location:** `apps/template/packages/ui/`
**Contents:** empty directory.

**Implementation state.** Empty. No `package.json` means no React / Vue / framework dependency declared. Likely the home for shared components (Button, Form, OrgSwitcher, etc.) consumed by `apps/web` and the admin package. The tech stack is not decided.

---

### 1.14 `@deessejs/utils` — shared utilities (EMPTY SKELETON)

**Location:** `apps/template/packages/utils/`
**Contents:** empty directory.

**Implementation state.** Empty. Today, "shared" code lives inline in each package (`normalizePath` in `cache/keys`, `globToRegex` in `cache/memory`, `sleep`/`isSerializationFailure` in `database/transactions`, etc.). A utils package would centralize these, but it's not bootstrapped.

---

## 2. Global architecture overview

### 2.1 Package dependency graph (actual, from package.json)

```
                          ┌─────────────────┐
                          │   apps/web      │
                          │   (Next.js)     │
                          └────────┬────────┘
                                   │ imports `app` from @deessejs/api
                                   ▼
                          ┌─────────────────┐
                          │  @deessejs/api  │
                          └──┬───────────┬──┘
                             │           │
                             │           │     (also reads authContext
                             │           │      populated by auth.ts,
                             │           │      but auth is imported
                             │           │      by api transitively)
                             ▼           ▼
                  ┌──────────────┐  ┌──────────────────┐
                  │ @deessejs/   │  │  @deessejs/      │
                  │    auth      │  │    database      │
                  └──────┬───────┘  └──────────────────┘
                         │
                         │ imports createClient + schema namespace
                         │
                         └──────────────────────────► (back to database)
```

**Exact internal dependencies declared in `package.json`:**
- `@deessejs/api` → `@deessejs/auth`, `@deessejs/database`
- `@deessejs/auth` → `@deessejs/database`
- `@deessejs/cache` → (none internal)
- `@deessejs/database` → (none internal)

**Standalone (no internal deps):** cache, database.
**Internal-leaf (no one imports them):** cache (today).
**Empty (no package.json):** admin, ai, i18n, logs, mail, notifications, sdk, storage, ui, utils.

The graph is a clean DAG: `web → api → {auth, database}`. The `api → auth` edge is for `Auth`/`Session`/`User` type imports (used in `types.ts` and `context.ts`). The `auth → database` edge is for `createClient()` + `schema` (the Drizzle namespace passed to `drizzleAdapter`). **No cycles.**

### 2.2 External tech stack

| Domain | Library | Version |
|---|---|---|
| HTTP server | Hono | ^4.6.0 |
| RPC / API contract | oRPC (`@orpc/server`, `@orpc/client`, `@orpc/openapi`, `@orpc/zod`) | ^1.14.0 |
| Validation | Zod | ^4.0.0 |
| Auth | Better Auth + `@better-auth/api-key`, `@better-auth/drizzle-adapter`, `@better-auth/passkey` | 1.6.19 / 1.6.11 |
| ORM | Drizzle ORM | ^0.45.2 |
| Postgres driver (prod) | postgres.js | ^3.4.5 |
| Postgres (tests) | PGlite (in-memory WASM) | ^0.5.3 |
| Migrations | drizzle-kit | ^0.30.1 |
| Cache | Upstash Redis | ^1.34.0 |
| Test runner | Vitest | ^2.1.0 |
| Lint | ESLint 9 + typescript-eslint | ^9 / ^8.61.1 |
| TypeScript | strict, ES2022, Bundler resolution | ^5.4.0 |
| Node | >=20 | — |

### 2.3 Cross-cutting concerns

**Logging.** Hono's built-in `logger()` for access logs (in `hono/app.ts`). `console.error` for oRPC errors (`errors/log.ts`). No structured logger (pino, OTel spans). No request-scoped logger propagated through context — the `api` package exposes `onStart`/`onSuccess`/`onError`/`onFinish` from oRPC for procedure-level instrumentation but no logger is plumbed. **Gap.**

**Errors.** Single source of truth: `ORPCError` from `@orpc/server`. Wire codes centralized in `api/src/errors/codes.ts`. `serializeOrpcError(error, requestId)` is the only serializer. `customErrorResponseBodyEncoder` (in `api/src/hono/openapi.ts`) reshapes errors for `/api/v1/*` using AsyncLocalStorage for the requestId. The `/rpc/*` transport emits the oRPC default `{ json: { code, status, message } }` envelope. Two different wire shapes — documented and tested.

**Validation.** Zod 4 throughout. Schemas live in feature procedures (`core/<feature>/schemas.ts` — M1). The `api` package's `ZodToJsonSchemaConverter` is wired to `OpenAPIReferencePlugin` so OpenAPI generation is automatic from Zod schemas.

**Tenant isolation.** The pattern: every org-scoped table has `orgId`. Every query filters by `orgId` at the data-access layer (NOT in a query builder, NOT via RLS). The pattern is enforced by:
1. ESLint rule in `api/eslint.config.js` — `src/core/**` and `src/middlewares/orpc/**` cannot import `drizzle-orm` or `@deessejs/database/schema` directly. Must use data-access functions.
2. Cross-tenant pattern test in `database/tests/integration/_pattern/cross-tenant.test.ts` — demonstrates the WHERE clause.

**Auth.** Single `getSession` call per request (Hono middleware). oRPC just reads the result. `asResponse: true` for cookieCache refresh propagation (Better Auth workaround, tracked for PR #9667). Better Auth's `organization()` plugin provides the org model and RBAC roles.

**Rate limiting.** **STUB.** `api/src/middlewares/hono/rate-limit.ts` is a no-op with a one-time WARN. Better Auth's built-in rate limit is configured (sign-in: 5/min, etc.) but the `secondaryStorage` backing it is a no-op. The TODO explicitly says both must be wired before `/api/v1/*` goes public.

**CORS.** Buyer origin + `*.vercel.app` + localhost. `credentials: true` required for cookies. Two policies: permissive for `/api/auth/*` (any preview deploy), strict for `/api/v1/*` (configured via env).

---

## 3. Implementation status matrix

| Package | State | Public surface | Tests | Notable gap |
|---|---|---|---|---|
| `@deessejs/api` | Sprint 1 wiring complete; placeholders only | Full (app, router, procedures, middlewares, errors) | 2 integration test files (smoke, failure paths) | `core/` features, rate-limit middleware, procedure logging |
| `@deessejs/auth` | Sprint 1 complete | Full (auth instance, types, RBAC) | 1 integration test file (8 test cases) | Email senders (mail pkg), `secondaryStorage` |
| `@deessejs/cache` | Complete | Full (factory, key builders, types) | 3 test files | No consumers yet (waiting for auth + api) |
| `@deessejs/database` | Schema complete; no features | Partial (factory, env, retry, schema) | 1 helper + 1 pattern test | Feature modules (`src/users.ts`, etc.), explicit pool config |
| `@deessejs/admin` | EMPTY | — | — | Not bootstrapped |
| `@deessejs/ai` | EMPTY | — | — | Not bootstrapped |
| `@deessejs/i18n` | EMPTY | — | — | Not bootstrapped |
| `@deessejs/logs` | EMPTY | — | — | Not bootstrapped |
| `@deessejs/mail` | EMPTY | — | — | Not bootstrapped |
| `@deessejs/notifications` | EMPTY | — | — | Not bootstrapped |
| `@deessejs/sdk` | EMPTY | — | — | Not bootstrapped |
| `@deessejs/storage` | EMPTY | — | — | Not bootstrapped |
| `@deessejs/ui` | EMPTY | — | — | Not bootstrapped (no framework declared) |
| `@deessejs/utils` | EMPTY | — | — | Not bootstrapped |

**Summary.** 4 of 14 packages implemented (29%). 10 of 14 packages are empty directories (71%). The implemented packages form a coherent Sprint-1 foundation: API + Auth + Database + Cache, all type-safe, all tested at the integration level. The architecture docs (in `11-packages/`) cover the 4 implemented packages in depth. The other 10 have no docs.

---

## 4. Gaps and next steps

### 4.1 Critical gaps (block `/api/v1/*` going public)

1. **`@deessejs/mail` not implemented.** All auth email senders (`sendResetPassword`, `sendVerificationEmail`, `sendMagicLink`, `sendVerificationOTP`) are `console.log` placeholders. Magic-link / password-reset / email-verification / OTP flows will not work without this. **Likely implementation:** Resend adapter (referenced in comments).
2. **`auth.secondaryStorage` is a no-op.** Better Auth's built-in rate limit (`/sign-in/email: 5/min`, etc.) silently allows unlimited requests. **Fix:** wire `@upstash/redis` via `@deessejs/cache` — `createRedisClient()` already provides the factory, the auth package just needs to call `get`/`set`/`delete` through it. The `cache/keys.ts` already has `rateLimitIp` key builders.
3. **`api/src/middlewares/hono/rate-limit.ts` is a stub.** Even with `secondaryStorage` wired, the `/api/v1/*` token bucket is not enforced. Logs a one-time WARN — easy to miss in a deploy.

### 4.2 Functional gaps (M1 product work)

4. **`@deessejs/api/src/core/` is empty.** Documented pattern: `core/<feature>/schemas.ts` + `core/<feature>/procedures.ts` per feature module. The router has only `ping`/`pingAuth`/`pingOrg` placeholders. First real procedures need to be added per the product spec.
5. **`@deessejs/database` feature modules missing.** `src/users.ts`, `src/projects.ts`, etc. — the data-access functions that procedures call. Without these, no real feature can ship. The branded ID types and column builders are ready.
6. **`registry.ts` pattern not implemented.** The architecture docs describe a `FeatureApi` interface + `createRegistry()` factory for composable feature modules. The router currently does manual composition. The doc says: add the registry "when we have ≥ 2 feature modules, at which point the manual composition gets verbose."

### 4.3 Infrastructure gaps (M1–M2)

7. **`@deessejs/logs` empty.** No structured logger (pino), no request-scoped `ctx.log`, no OTel spans. Every package uses `console.log`/`console.error`. The architecture doc mentions pino/OTel in M1.
8. **`@deessejs/sdk` empty.** The API package exposes the OpenAPI spec at `/api/v1/spec.json` and Scalar UI at `/api/v1/docs`. No client SDK is generated. The `apps/cli` (also empty) cannot consume the API without it.
9. **`@deessejs/utils` empty.** Duplication risk grows as features land: `sleep`, `globToRegex`, `normalizePath`, branded-type helpers are scattered. Should consolidate before M1.
10. **`@deessejs/storage`, `@deessejs/notifications`, `@deessejs/ai` empty.** Product-shape features; will be defined as product requirements firm up.

### 4.4 Documentation gaps

11. **Architecture docs cover only 4 packages.** `documents/internal/architecture/11-packages/` has READMEs for `api`, `auth`, `cache`, `database`. The other 10 packages need READMEs and `structure.md` files before they can be implemented cleanly. The README template is in `11-packages/README.md`.
12. **No `decisions/` for cache, database.** API has `0001-node-runtime-not-edge.md`. Auth and cache/db have no local ADRs.
13. **`apps/cli` and `apps/docs` are empty.** `apps/web` is the only app with source.

### 4.5 Type / API drift to watch

14. **Better Auth OTP endpoint rename.** `auth.test.ts` notes Better Auth 1.6.19 renamed `auth.api.sendVerificationOTP` (likely to `signInEmailOTP`). Needs verification before OTP tests re-enable.
15. **`auth.api` type cast** in `api/src/middlewares/hono/auth-client.ts` — `as unknown as AuthApiSubset`. Documented as a Better Auth issue #4222 workaround. Two methods (`getFullOrganization`, `getActiveMemberRole`) lose their types. If Better Auth fixes the re-export, this file can be deleted (one-line change per consumer).
16. **Better Auth `asResponse: true` workaround.** Tracked for cleanup when PR #9667 ("fix: forward session cookie refresh headers") merges. When that lands, switch to the cleaner `returnHeaders: true` API.
17. **`@deessejs/api/src/router.ts`** is a single file that imports from `./public` and `./authorized`. As features land, this will become a composition-of-many-maps pattern. The `registry.ts` abstraction is the documented answer.

---

## 5. Verdict

The Sprint-1 backend foundation is solid. The four implemented packages (`api`, `auth`, `cache`, `database`) form a coherent, well-documented, tested, type-safe core. The Hono + oRPC + Better Auth + Drizzle + Upstash + Zod stack is consistent end-to-end. The tenant-isolation pattern is explicit, enforced by ESLint, and demonstrated by tests. The cross-cutting concerns (errors, validation, request ID, CORS, single getSession per request) are documented and tested.

What's missing is the *product*: 10 empty packages and zero real feature procedures. The next move is **M1**: implement `@deessejs/mail` (so auth flows work), wire `auth.secondaryStorage` (so rate limits work), implement the `@deessejs/api/src/core/<feature>/` modules with the registry pattern, add the matching data-access functions in `@deessejs/database`. Then M2 can fill in `logs`, `sdk`, `storage`, `notifications`, `ai`.

The architecture is sound. The implementation is 29% complete. The risk is not technical — it's sequencing. The 10 empty packages are mostly independent, but `mail`, `logs`, and `sdk` are blocking multiple downstream concerns.
