# ADR-001: RPC for templates

## Status

Accepted (2026-08).

## Context

The marketing site, the authenticated product, and the published CLI
all need the list of available templates. The data lives in
`packages/database` and is sourced from GitHub at request time by
`packages/api/src/services/templates-fetcher.ts`.

Three options were considered:

1. **REST endpoint**: a Hono route at `/api/v1/templates` that
   returns the catalog as JSON. Each consumer fetches it with
   `fetch()` and parses manually.
2. **Server-side fetch with shared cache**: a Next.js `unstable_cache`
   around a `fetch`, shared between consumers via a package.
3. **oRPC procedure**: a typed `templates.list` procedure exposed
   through the existing `appRouter`.

## Decision

**Option 3: oRPC procedure (`templates.list`).**

Reasons:

- The typed `RouterClient<typeof appRouter>` gives every consumer the
  full input/output type inference. REST loses that.
- The existing `RPCHandler` infrastructure is already mounted at
  `/api/v1/rpc/*`. No new transport.
- The error wire format (`ORPCError`) is already unified across
  procedures. A REST endpoint would need its own error handling.

## Consequences

- All consumers go through `appRouter.templates.list()`. There is no
  REST fallback for templates. If you find a `fetch("/api/v1/...")` in
  a consumer, it is a bug — replace with `client.templates.list()`.
- The procedure handler in `packages/api/src/router/templates.ts`
  stays thin. It calls `fetchTemplates(TEMPLATES)` from
  `services/templates-fetcher.ts`. Business logic lives in the
  service.
- If GitHub is down, the procedure throws
  `ORPCError("TEMPLATES_FETCH_FAILED", { status: 503 })`. The
  consumer renders an error state. No silent fallback.

## What we are not doing in V1

- **Server-side cache** (Redis, Vercel KV): deferred. Phase 4 of
  `docs/engineering/plans/orpc-client-migration.md` discusses this.
- **Background refresh**: deferred. The cache is hit on every
  procedure call. If volume grows, we'll add a TTL'd in-memory
  cache or move to a shared store.
- **Multiple template categories as separate procedures**: the
  `category` field on the registry entry handles filtering. We don't
  split into `templates.listByCategory` unless that becomes a real
  bottleneck.
