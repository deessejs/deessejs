---
title: "Robust shared backend (REST + RPC) consumed by web and CLI"
author: martyy-code
generated: 2026-08-03
status: approved
labels: [area:api, area:cli, area:web, priority:high]
decisions:
  - id: versioning
    date: 2026-08-03
    choice: "URL prefix /api/v1/"
    rationale: "Cache-friendly, easier to debug, matches CLI tooling expectations."
  - id: shared-contracts
    date: 2026-08-03
    choice: "Invest in @workspace/contracts"
    rationale: "Eliminates schema duplication; load-bearing primitive for the auth and templating roadmap."
  - id: cookie-scoping
    date: 2026-08-03
    choice: "Audit first, change on concrete threat"
    rationale: "Documented coupling risk accepted until threat model surfaces a concrete vector."
  - id: cli-cache
    date: 2026-08-03
    choice: "Plain JSON in ~/.deessejs/"
    rationale: "Zero native dependency, sufficient for current catalog size (3 templates)."
  - id: web-pages
    date: 2026-08-03
    choice: "SSG + ISR, server-side fetch from /api/v1/templates, contract import, minimal cards, minimal detail page"
    rationale: "Aligns apps/web with the shared contract, single source of truth for the registry, SEO-friendly without coupling build to data freshness."
---

# Robust shared backend (REST + RPC) consumed by web and CLI

_Date: 2026-08-03. Status: approved. Analysis with locked implementation decisions. No code changes yet._

## Context

The same backend (`packages/api`, a Hono app) is consumed by two distinct surfaces:

1. **`apps/cli`**: a published Node ESM CLI (`@deessejs/cli`) that today only calls `GET /api/templates` to discover and clone templates from GitHub.
2. **`apps/app`**: the authenticated Next.js 16 product, which mounts the same Hono app via `handle(api)` in `apps/app/app/api/[[...route]]/route.ts` and consumes both REST (`/auth/*`, `/health`, `/ready`) and oRPC (`/rpc/*`) endpoints, the latter through a typed RPC client in `apps/app/lib/orpc.ts`.

`apps/web` (marketing site) currently exposes only static pages (blog, changelog, legal). This plan adds two new routes: `/templates` and `/templates/[template_slug]`, both backed by the same `/api/v1/templates` endpoint that the CLI consumes. The "web" surface in this plan therefore covers both `apps/app` (authenticated product) and `apps/web` (marketing, with the new templates pages).

The current architecture is functional but lacks the affordances of a multi-consumer API:

- The `Template` schema is duplicated between `packages/api/src/templates.ts` and `apps/cli/src/api.ts`, validated at runtime by a hand-written `isTemplate` type guard.
- The REST surface is unversioned (`/api/templates` with no `/v1/` prefix), unauthenticated by design, has no caching headers, no rate limiting, no pagination, no request IDs, and no global error handler beyond Hono's defaults.
- The CLI has no retry, no offline cache, no version negotiation, and no degraded mode; a single network failure aborts the run.
- `/templates` is documented as "public for V1; gate behind `authGuard` in V1.1" in `packages/api/src/index.ts`, but no coexistence path exists for the in-the-wild CLI clients.
- The API package's tests (`packages/api/tests/routes.test.ts`) construct local `new Hono()` instances with the same patterns; the real exported `api` is not integration-tested, and there is no end-to-end test that proves `apps/app`'s catch-all actually mounts it.

This plan is strategy. It does not write implementation code, open PRs, or touch production files.

## Goals

- Eliminate schema duplication between backend and CLI by introducing a single shared contract package.
- Version the REST surface so that future breaking changes do not silently break installed CLI versions.
- Treat `/api/templates` as a real product: cacheable, paginated, filterable, rate-limited, documented.
- Make the CLI resilient to backend outages and to backend drift (CLI version behind server minimum).
- Add observability (request IDs, structured errors, optional tracing) without committing to a specific backend vendor.
- Prepare the auth migration for "pro templates" without rewriting the public surface.
- Surface the registry on the marketing site via `/templates` and `/templates/[template_slug]`, sourced from the same shared contract that the CLI and `apps/app` consume.

## Non-goals

- Implementing any of the recommendations in this plan. This document is analysis.
- Replacing `TEMPLATES` with a DB-backed registry. (Referenced as a future phase.)
- Building a separate microservice for the templates registry. The shared `packages/api` Hono app stays the single source.
- Adopting a new RPC framework. oRPC stays.
- Mobile clients, third-party SDKs, or GraphQL.

## Current architecture (recap)

```
┌────────────────────┐  GET /api/templates  ┌──────────────────────────────────────┐
│ apps/cli (CLI ESM) │ ───────────────────▶ │ packages/api (Hono on Vercel)        │
│  - list / info /   │                     │  ├─ /health                            │
│    init            │                     │  ├─ /ready   (ping Postgres)           │
│  - fetch natif     │ ◀───── JSON ──────── │  ├─ /auth/*  (Better Auth)             │
│  - type guards     │                     │  ├─ /templates (TEMPLATES[])           │
│  - ora + picocolors│                     │  └─ /rpc/*    (oRPC + session mw)      │
│  - spawn git/npm   │                     │                                       │
└────────────────────┘                     └──────────────────────────────────────┘
                                                       ▲
                                                       │ /api/* same path
                                                       │
                                            ┌──────────────────────────┐
                                            │ apps/app (Next.js 16)    │
                                            │  proxy.ts = auth gate    │
                                            │  catch-all /api/* → Hono │
                                            │  client oRPC @/lib/orpc  │
                                            └──────────────────────────┘
```

### What works today

- One Hono app, one deployment, one set of env vars (`turbo.json` propagates `DATABASE_URL`, `BETTER_AUTH_SECRET`, etc.).
- `apps/app/app/api/[[...route]]/route.ts` uses `handle(api)` from `hono/vercel`: no `as any`, no per-route dispatch.
- Session middleware runs once per request and populates `c.var.user/session`, consumed by `authGuard` in `packages/api/src/router/auth-middleware.ts`.
- The body-parser `Proxy` wrapping `c.req.raw` for oRPC prevents the "Body Already Used" issue.
- `/health` and `/ready` are split: the former for liveness, the latter pings Postgres and returns 503 on failure.
- The CLI is self-contained: tsup ESM bundle, `commander` + `ora` + `picocolors`, no HTTP client dep, no Git dep.
- Tests on both sides: unit + integration for the CLI (`apps/cli/test/`), pattern tests for the API (`packages/api/tests/`).

### Where the current design is fragile

| Area | Symptom | Underlying gap |
|---|---|---|
| Schema | Adding a required field on `TEMPLATE` breaks old CLI silently (`isTemplate` rejects → `parse_error`) | No shared contract package; no URL versioning |
| REST | `/api/templates` has no `/v1` prefix, no `ETag`, no `Cache-Control`, no rate limit headers | Built as a private internal endpoint, not a product |
| CLI | `enrich` throws `networkError` on first DNS failure | No retry, no offline cache, no degraded mode |
| Observability | Hono default logger, `console.error("[oRPC]", error)` | No request ID, no structured errors, no trace propagation |
| Auth | `/templates` is public; comment in `packages/api/src/index.ts` says "V1.1 will gate this" | No coexistence plan for installed CLI V1 |
| Tests | API tests construct local `new Hono()` instances | Real `api` export is not integration-tested |
| Hosting | API served from `apps/app/app/api/[[...route]]/route.ts` via `handle(api)` on `app.deessejs.com` | Product surface (HTML, marketing pages, marketing cookies) and API surface share one origin, one CDN, one Vercel project, coupling that limits some optimizations but also means a single deployment unit |

## Target architecture

```
                                   ┌────────────────────────────────────────────────┐
                                   │ @workspace/contracts (NEW)                      │
                                   │  - Zod schemas: TemplateV1, ApiResponseV1 …    │
                                   │  - generated TS types                           │
                                   │  - JSON Schema export for OpenAPI               │
                                   │  - versioned: /v1, /v2                          │
                                   └────────────┬───────────────────────────────────┘
                                                │ imports
                ┌───────────────────────────────┼───────────────────────────────┐
                │                               │                               │
                ▼                               ▼                               ▼
┌────────────────────────────┐  ┌──────────────────────────────┐  ┌──────────────────────┐
│ packages/api (server)      │  │ apps/cli (client)            │  │ apps/app (client)    │
│  - imports contracts       │  │  - imports contracts         │  │  - imports contracts │
│  - parses() on REST inputs │  │  - validates API responses   │  │  - oRPC over /rpc/v1 │
│  - REST + oRPC over /api   │  │  - cache disk + retry        │  │  - REST + oRPC       │
│  - rate limit + ETag       │  │  - offline mode + version chk│  │  - typed RPCClient   │
│  - request ID middleware   │  │  - device auth (V1.1)        │  │  - session via cookie│
└─────────────┬──────────────┘  └──────────────────────────────┘  └──────────┬───────────┘
              │ all routes mounted by handle(api)                              │
              ▼                                                                 │
┌──────────────────────────────────────────────────────────────────┐            │
│ apps/app (Next.js 16) — single deploy on app.deessejs.com       │ ◀──────────┘
│  catch-all app/api/[[...route]]/route.ts → handle(api)          │  same-origin
│  proxy.ts = auth gate for HTML routes                            │
│  /api/v1/templates, /api/v1/rpc, /api/v1/auth, /api/v1/health   │
└──────────────────────────────────────────────────────────────────┘
              ▲
              │ server-side fetch (SSG + ISR, revalidate 600s)
              │
┌──────────────────────────────────────────────────────────────────┐
│ apps/web (Next.js 16) — deploy on app.deessejs.com (or own host) │
│  /templates                  ← RSC, contract-validated           │
│  /templates/[template_slug]  ← RSC, generateStaticParams         │
│  imports @workspace/contracts (Zod), @workspace/ui (components)  │
└──────────────────────────────────────────────────────────────────┘
```

> **Hosting note.** The API is not a separate microservice. It is served by the Next.js catch-all in `apps/app/app/api/[[...route]]/route.ts`, on the same origin (`app.deessejs.com`) as the authenticated product. `packages/api` exports a Hono app; `handle(api)` from `hono/vercel` makes it routable from Next.js. Any optimization that would normally require a separate origin (isolated CDN cache, separate rate-limit budgets, dedicated auth cookie scope) has to be applied within this single deployment unit, or accepted as a known coupling.

> **`apps/web` placement.** `apps/web` is a separate Vercel project. The new templates pages fetch from `https://app.deessejs.com/api/v1/templates` server-side (RSC, not browser), so the request never crosses the user's browser. The marketing origin pulls from the product origin over the same Vercel edge network. CORS is not in the path because the request is server-to-server.

### What changes for each surface

**`@workspace/contracts`** (new package):
- Exports Zod schemas for every REST and RPC payload: `TemplateV1`, `TemplateListResponseV1`, `DeviceAuthRequestV1`, etc.
- Exports the matching TS types via `z.infer`.
- Generates JSON Schema via `@zod/to-json-schema` for OpenAPI emission.
- Versioned via directory layout: `src/v1/`, `src/v2/`. Each version is a frozen snapshot.
- Built with `tsc` like other workspace packages.

**`packages/api`**:
- Replaces inline `Template` type with `import type { TemplateV1 } from "@workspace/contracts/v1"`.
- Replaces inline `TEMPLATES` import in `/templates` handler with a runtime-validated source (initially the hand-curated array, later DB-backed).
- Adds `requestId` middleware (`crypto.randomUUID()`, header `X-Request-Id`).
- Adds global `app.onError` that returns `{ code, requestId }` and never leaks stacks.
- Adds `secureHeaders()` middleware.
- Mounts oRPC at `/api/v1/rpc/*` with prefix-scoped `RPCHandler`.
- Adds `ETag` + `Cache-Control` to `/api/v1/templates` and `/api/v1/cli-version`.
- Adds rate-limit middleware (`X-RateLimit-*` headers).
- Adds `zValidator("query", …)` for any future filtered endpoint.

**`apps/cli`**:
- Imports the shared contract; `enrich` parses the response through `TemplateListResponseV1.parse()`.
- Adds disk cache at `~/.deessejs/templates.json` keyed by ETag.
- Adds retry (3 attempts, 250ms / 750ms / 2s with jitter) before falling back to cache.
- Adds `--offline` flag that skips network entirely if cache exists.
- Calls `GET /api/v1/cli-version` on startup, warns (non-blocking) when local < server-minimum.
- V1.1: implements OAuth 2.0 Device Authorization Grant; stores token in OS keychain via `keytar`.

**`apps/app`** (the Next.js product):
- The catch-all `apps/app/app/api/[[...route]]/route.ts` is unchanged in shape: `export const dynamic = "force-dynamic"` stays, and `handle(api)` mounts a now-versioned Hono app on the same origin (`app.deessejs.com`).
- `apps/app/lib/orpc.ts` keeps its relative `RPCLink({ url: API_RPC_PATH })`. The client stays same-origin; cross-origin clients are not in scope.
- `apps/app/proxy.ts` continues to gate HTML routes (`/home`, `/settings`, `/login`, etc.); API routes (`/api/*`) bypass the proxy and go through Hono directly.

**`apps/web`** (the marketing site, new surface for the registry):
- New route `apps/web/src/app/templates/page.tsx` (RSC, `export const revalidate = 600`):
  - Server-side `fetch("https://app.deessejs.com/api/v1/templates", { next: { revalidate: 600, tags: ["templates"] } })`.
  - Response validated by `TemplateListResponseV1.parse()` from `@workspace/contracts/v1`.
  - Renders a grid of cards: each card shows `slug`, `name`, `category`, `license`, `description`, and a "Copy" button emitting `deessejs init <slug>` to the clipboard via a small client component.
  - Empty / error / loading states per `DESIGN.md` §4.3.
- New route `apps/web/src/app/templates/[template_slug]/page.tsx` (RSC):
  - `generateStaticParams()` returns one entry per template in the list, so all current slugs are pre-rendered.
  - `generateMetadata({ params })` returns per-template `title`, `description`, `openGraph` for SEO.
  - `notFound()` when the slug is not in the registry (404 page is the existing `apps/web/src/app/not-found.tsx`).
  - Body: name, full description, labels, `owner/repo` link, license, and the same copyable install command.
- `apps/web/package.json` gains `@workspace/contracts` as a `workspace:*` dependency.
- No client-side state, no JS framework beyond what Next.js + `@workspace/ui` already provide.
- Cookie-free: the marketing site is unauthenticated. The new pages must not pull session or trigger Better Auth.

### Cross-cutting changes

- `packages/api/src/base-path.ts` becomes:
  - `API_BASE_PATH_V1 = "/api/v1"`
  - `API_BASE_PATH = API_BASE_PATH_V1` (alias for the active version)
  - `API_RPC_PATH`, `API_AUTH_PATH`, `API_HEALTH_PATH`, `API_READY_PATH` derived from `V1`.
- Deprecation policy: when a route is superseded, it stays mounted for 6 months with `Deprecation: true` and `Sunset: <RFC 8594 date>` headers, plus a `console.warn` on the server.
- Error envelope: `{ code: string, message: string, requestId: string, details?: unknown }` for both REST and oRPC.

## Six structuring decisions

Ranked by cost / benefit. The first three are mutually compatible and can ship together.

| # | Decision | Benefit | Cost | When |
|---|---|---|---|---|
| 1 | New `@workspace/contracts` package with Zod schemas, plus `/api/v1` URL prefix | Eliminates schema duplication; enables safe breaking changes later | Mechanical migration; one PR per consumer | **Now** |
| 2 | `X-Request-Id` middleware + global error handler + structured logs | Debuggability, support, compliance, no vendor lock-in | ~30 lines of middleware | **Now** |
| 3 | `ETag` + CLI disk cache + retry with jitter | CLI resilience, offline-first, bandwidth savings | Small on both sides | **Now** |
| 4 | Cookie scoping audit on the shared origin (no behavioral change in this plan) | Threat-model the shared cookie jar; only act if a concrete vector is found | One audit document, no code changes | Before CLI V1.1 (gated on threat model) |
| 5 | OAuth 2.0 Device Authorization Grant + keychain tokens | Unlocks private / pro templates | ~1-2 sprints, spec to follow | CLI V1.1 |
| 6 | DB-backed templates registry + admin write endpoints | Scales registry, enables dynamic curation | Schema migration + write endpoints with `templates:write` scope | When count > ~10 templates |
| 7 | Marketing pages `/templates` and `/templates/[template_slug]` in `apps/web` | Surfaces the registry on the public site; aligns web with the shared contract; SEO-friendly with ISR | 2 new RSC routes, `apps/web` adds `@workspace/contracts` dep, OG metadata per template | **Now** (same sprint as items 1-3) |

> **Why no subdomain split.** A separate `api.deessejs.com` would require a second Vercel project, a second deployment pipeline, and a separate env contract. The shared-origin design is intentional and load-bearing for the current operational model (one app, one deploy, one set of env vars propagated by `turbo.json`). The recommendations in this plan stay within that model. If the product grows enough to justify the split, it is a separate plan.

### Locked decisions

The four questions that gated this plan have been resolved (see frontmatter `decisions:` log). The choices propagate into the rest of the plan as follows.

| # | Decision | Locked choice | Impact on the plan |
|---|---|---|---|
| 1 | Versioning strategy | **URL prefix `/api/v1/`** | `packages/api/src/base-path.ts` switches to `API_BASE_PATH_V1 = "/api/v1"`. All routes move to `/api/v1/templates`, `/api/v1/rpc`, `/api/v1/auth`, `/api/v1/health`, `/api/v1/ready`. The old `/api/*` paths are not kept in this plan; CLI V1.x clients are upgraded to use `/api/v1/` in lockstep. If a coexistence window is needed, it is a separate plan. |
| 2 | Shared contracts package | **Invest in `@workspace/contracts`** | New `packages/contracts` workspace. Server and CLI both import from it. The duplicate `Template` types in `packages/api/src/templates.ts` and `apps/cli/src/api.ts` are removed. The hand-written `isTemplate` type guard in the CLI is replaced by `TemplateV1.parse()`. |
| 3 | Cookie scoping | **Audit first, change on concrete threat** | No cookie changes in the implementation sprint. A separate audit task is added to the roadmap (see "Follow-up work" below) to review `packages/auth/src/auth.ts` cookie attributes and the threat surface for the shared origin. |
| 4 | CLI cache format | **Plain JSON in `~/.deessejs/`** | Cache file `~/.deessejs/templates.json` keyed by ETag. Retry policy: 3 attempts (250ms / 750ms / 2s with jitter) before falling back to cache. No native dep added to the CLI. |
| 5 | `apps/web` templates pages | **SSG + ISR, server-side fetch from `/api/v1/templates`, contract import, minimal cards, minimal detail page** | New routes `apps/web/src/app/templates/page.tsx` and `apps/web/src/app/templates/[template_slug]/page.tsx`. `apps/web` becomes a consumer of `@workspace/contracts`. No new fields required on `TemplateV1` (uses the same minimal set the CLI displays). |

## Risks and trade-offs

- **Bigger surface to test.** With versioning, cache, retry, and request IDs in play, the test matrix grows. Mitigate by snapshotting the OpenAPI doc and adding a contract test on the CLI side that round-trips real server responses (VCR-style).
- **Bundle size of the CLI.** Adding `keytar`, retry helpers, and a disk-cache layer bumps `dist/index.js`. Currently the bundle is small. Mitigate by lazy-loading auth and disk-cache modules so the `list` / `info` paths stay slim.
- **Multiple Hono versions across consumers.** Already mitigated by the `pnpm-workspace.yaml` `hono: ^4.12.28` override (see the comment in the catalog). Keep this override discipline as new middleware is added.
- **Vercel cold start + `/ready`.** When `apps/app` cold-starts, `/ready` will 503 until Postgres is reachable from the new region. This is expected. Document it in the deployment runbook rather than papering over it with retries.
- **Breaking changes during the migration.** The plan must preserve wire compatibility: while the contract is moving from inline to `@workspace/contracts`, the JSON shape on the wire must not change. The migration is a refactor, not a release.
- **`apps/web` now depends on `app.deessejs.com` uptime.** Today `apps/web` has zero runtime dependency on the product app. Once the templates pages fetch from `/api/v1/templates`, a Vercel incident on `apps/app` will surface as empty grids on the marketing site. Mitigate by: (a) ISR with `revalidate: 600` so the cache absorbs short blips; (b) a fallback that renders the last known list from the ISR cache, not a hard error; (c) a published runbook for "marketing site shows empty templates" that points to ISR cache warming, not on-call for the backend team.

## Follow-up work

Concrete items not in the implementation sprint but tracked as separate tasks.

- **Cookie scoping audit (decision #3 follow-up).** Produce `docs/engineering/reports/security/cookie-jar-audit.md` reviewing:
  - Where Better Auth sets cookies (see `packages/auth/src/auth.ts`).
  - Where the `proxy.ts` gate sits relative to `/api/v1/*` routes.
  - The actual attack surface for an XSS or CSRF bug on a HTML route to leak a session token honored by `/api/v1/rpc`.
  - Recommendation: leave as-is, scope cookies (`Path=/api/`, `SameSite=Strict`), or split sessions.
  - Owner: security review. Trigger: any change to `packages/auth` cookie config.
- **OpenAPI doc generation.** Once `@workspace/contracts` exists, generate `openapi.json` from the Zod schemas and serve it at `/api/v1/openapi.json`. This is a precondition for any third-party SDK work, not a current blocker.
- **CLI upgrade path.** A documented upgrade matrix: which CLI version targets which API version. Becomes important the day `/api/v2` lands.

## Out of scope (deferred plans)

- Replacing `TEMPLATES` with a DB-backed registry, separate plan once the registry exceeds ~10 entries or needs per-tenant scoping.
- Multi-region deployment and read replicas, separate plan once traffic justifies it.
- Webhooks for registry events (e.g. "new template version published"), separate plan.
- Switching from oRPC to something else, explicitly not planned.

## Related documents

- `docs/engineering/plans/saas-template-divergence.md`: fork relationship with `deessejs/saas-template` upstream.
- `docs/engineering/plans/cli-v1-testing.md`: CLI test strategy.
- `docs/engineering/plans/cli-errors-fp-integration.md`: error model used by the CLI.
- `docs/engineering/reports/versioning/11-templates-not-cli.md`: why template content is not part of CLI versioning.
- `docs/guides/better-auth/index.md`: locked decisions around Better Auth that this plan must respect (no organization plugin, single-tenant).
- `DESIGN.md` §4.3: empty / loading / error state patterns the new `apps/web` templates pages must follow.