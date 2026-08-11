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

## What this ADR does not allow

- **Server-side cache** (Redis, Vercel KV): the registry is fetched
  on every procedure call. If the volume grows enough to justify the
  extra dependency, secret, and latency, this ADR is superseded by
  one that does.
- **Background refresh**: deferred at the registry layer. The procedure
  call always hits the upstream source. A TTL'd in-memory cache or a
  shared store can be added later if the upstream rate-limit becomes
  a real constraint.
- **Multiple template categories as separate procedures**: the
  `category` field on the registry entry handles filtering. A
  per-category procedure is added only if the single-procedure path
  becomes a real bottleneck.
