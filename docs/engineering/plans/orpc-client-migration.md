---
title: "Migrate CLI + web to @orpc/client + RPCLink"
author: martyy-code
generated: 2026-08-10
status: draft
labels: [area:api, area:cli, area:web, priority:medium]
decisions:
  - id: client-typed
    date: 2026-08-10
    choice: "Use @orpc/client + RPCLink for both apps/cli and apps/web"
    rationale: "Single source of truth for wire shape and types. The client ships a typed RPC envelope and a typed error model (ORPCError) that we map onto our CliError codes."
  - id: cli-retry-preserved
    date: 2026-08-10
    choice: "Keep fetchWithRetry as the underlying fetch, exposed through RPCLink's `fetch` hook"
    rationale: "The CLI's retry/backoff/429-aware fetch is load-bearing. RPCLink accepts a custom fetch via its `fetch` option. We wrap our retry result into a Response at the boundary; the retry semantics live in fetchWithRetry, not in oRPC."
  - id: error-mapping
    date: 2026-08-10
    choice: "Map ORPCError.code -> CliError.code at the consumer site, not in the client"
    rationale: "The CLI needs its own error codes (network_error, parse_error). ORPCError.code is a server-defined code (we use the same vocabulary already). The client should not silently swallow the distinction between 'fetch failed' and 'server returned 503 with code templates_fetch_failed'."
  - id: web-rsc
    date: 2026-08-10
    choice: "Use @orpc/client with custom fetch that threads Next.js ISR directives"
    rationale: "Replaces the verbose direct-fetch + manual unwrap with a typed client. The custom fetch forwards `context.next.revalidate` and `context.next.tags` to the global fetch, preserving ISR semantics that the manual version had."
  - id: hono-audit
    date: 2026-08-10
    choice: "Server-side Hono integration is faithful to the oRPC guide, no changes required"
    rationale: "Audited against https://orpc.dev/docs/adapters/hono: RPCHandler, body-parser Proxy, prefix, c.newResponse, await next() all in place. The only follow-up is a comment clarifying the two-tier error handling."
---

# Migrate CLI + web to @orpc/client + RPCLink

_Date: 2026-08-10. Status: draft. Working document — not yet approved._

## Server-side audit: oRPC Hono integration

Before planning the client migration, we audited `packages/api/src/index.ts` against the official oRPC Hono guide ([https://orpc.dev/docs/adapters/hono](https://orpc.dev/docs/adapters/hono)). The current implementation is faithful to the guide:

- `RPCHandler(router, { interceptors: [onError(...)] })` for error logging at the oRPC layer.
- `app.use('/rpc/*', async (c, next) => { ... })` middleware that handles oRPC traffic and falls through to Hono for non-matches.
- **Body-parser Proxy**: `c.req.raw` is wrapped in a `Proxy` that redirects the five body-parser methods (`arrayBuffer`, `blob`, `formData`, `json`, `text`) to Hono's parsed getters. This is the canonical fix for the "Body Already Used" error documented in the guide.
- `c.newResponse(response.body, response)` to forward the handler's response back through Hono with the right status and headers.
- `prefix: '/rpc'` on `handler.handle(...)`.
- `await next()` after a non-match so Hono's 404 handler picks up unknown routes.

The only concrete server-side tweak we'd suggest (orthogonal to this plan) is to document the two-tier error handling in `index.ts`: oRPC interceptor catches oRPC-level errors, Hono `onError` catches middleware/handler errors from non-oRPC routes. That split is correct but easy to undo by accident when adding a third path.

**No server-side changes are required for this plan to land**. Phases 1-4 are all client-side.

## Context

The shared backend (`packages/api`) exposes procedures through `RPCHandler` mounted at `/api/v1/rpc/*`. The CLI (`apps/cli`) and the marketing site (`apps/web`) already migrated to talk oRPC at the wire level (PR #45, commits `179e9e9` and `0b3568b`), but they speak raw HTTP + manual envelope unwrap.

The pattern is verbose at the call site, error-prone (one missed `data.` throws a confusing `parse_error`), and it doesn't leverage the type guarantees of `@orpc/client`. We want to use the typed client everywhere — but the migration has surfaced a non-trivial gap in our retry-and-error machinery.

## What we tried (and why it broke)

A first attempt introduced `RPCLink({ url, fetch: orpcFetch })` with a custom `fetch` that wrapped `fetchWithRetry`. The hook signature we used was:

```ts
const orpcFetch: typeof fetch = (request, init) => { /* ... */ }
```

That signature is **wrong**. The actual `RPCLink` hook signature, found in `@orpc/client/dist/adapters/fetch/index.d.ts`, is:

```ts
fetch?: (
  request: Request,
  init: { redirect?: Request['redirect'] },
  options: ClientOptions<T>,
  path: readonly string[],
  input: unknown
) => Promise<Response>
```

Five arguments, not two. The `as unknown as ReturnType<typeof fetch>` cast hid the incompatibility at compile time. At runtime, the resulting client mis-interpreted responses (200 with malformed payload thrown as `network_error` instead of `parse_error`), which surfaced as 4 failing tests.

We committed the broken state as `9b003da` (work in progress checkpoint) before going deeper.

## What's actually available

### The `RPCLink` hook

`RPCLink` (`@orpc/client/adapters/fetch`) accepts a `fetch` option typed as above. It is the canonical way to inject retry/auth/observability around the wire call. We have to type our wrapper correctly and accept all five arguments.

### The error model

`ORPCError` (`@orpc/client/dist/shared/client.tBERYXHN.mjs`) is a real `Error` subclass with `code`, `status`, `message`, `data`. The client wraps any non-`ORPCError` thrown into `new ORPCError("INTERNAL_SERVER_ERROR", ...)`.

Server-side, our `errorBody(c, code, message)` helper produces a `{ defined: true, code, status, message, data }` JSON. The client decodes that into an `ORPCError`. So `ORPCError.code === "templates_fetch_failed"` is exactly our server-side `code`.

### The `ClientOptions` argument

The third argument (`options`) carries `context`, which oRPC also passes through interceptors and plugins. We use it today to send `next.revalidate` and `next.tags` from `apps/web`. On the CLI we use it to thread CLI-level state (none yet, but room is there).

## Plan

### Server-side audit (against the oRPC Hono guide)

The current `packages/api/src/index.ts` follows the oRPC Hono guide closely:

| Guide recommendation | Current code | Status |
|---|---|---|
| `RPCHandler(router, { interceptors: [onError(...)] })` | line 134-136 | OK |
| `app.use('/rpc/*', async (c, next) => { ... })` | line 138 | OK |
| Body-parser Proxy redirecting to Hono's `c.req` | line 142-155 | OK, with a minor comment about Hono's parsed getters being on the proxy target |
| `c.newResponse(response.body, response)` | line 172 | OK |
| `await next()` on non-match | line 175 | OK |
| `prefix: '/rpc'` on `handler.handle(...)` | line 158 | OK |
| `context: {}` passed to `handler.handle(...)` | line 159 | OK, we already thread `headers`, `user`, `session`, `requestId` |

**One concrete issue we should fix while we're in here** (orthogonal to the client migration but spotted during the audit): we have two `onError` paths:

1. `onError` interceptor on `RPCHandler` (line 135) — logs via our structured logger.
2. `api.onError(onApiError)` (line 57) — runs on Hono-level errors (anything thrown outside the oRPC middleware).

That's correct in principle, but the oRPC interceptor only fires for oRPC-level errors. Hono-level errors from the `await next()` chain (e.g. an error in the session middleware on a non-RPC route) are caught by the Hono `onError`. We should document this split in a comment so future contributors don't add a third path.

**No changes to the server code are required for the client migration to land**. Phase 1-4 are pure client-side refactors.

### Phase 1 — typed CLI client

1. **Type the wrapper correctly.** Rewrite `apps/cli/src/api.ts` so `orpcFetch` accepts all five arguments:

   ```ts
   import type { ClientOptions } from "@orpc/client"
   const orpcFetch = async <T>(
     request: Request,
     init: { redirect?: Request["redirect"] },
     _options: ClientOptions<T>,
     _path: readonly string[],
     _input: unknown,
   ): Promise<Response> => {
     // unwrap retry result -> Response
   }
   ```

   No `as unknown` cast. The signature is the one from `@orpc/client/adapters/fetch/index.d.ts`.

2. **Map ORPCError -> CliError.** Add a small helper next to `networkError` and `parseError` in `apps/cli/src/errors.ts`:

   ```ts
   import { ORPCError } from "@orpc/client"
   export const orpcToCliError = (e: unknown): CliError => {
     if (e instanceof ORPCError) {
       // Server returned a known code (templates_fetch_failed, not_found, etc.).
       // Surface as parse_error: the wire was reachable, the contract was respected,
       // but the application logic returned a defined error.
       return parseError(`server returned ${e.code}: ${e.data ?? e.message}`)
     }
     return networkError(e instanceof Error ? e.message : String(e))
   }
   ```

   Then `fetchTemplates` becomes:

   ```ts
   try {
     return (await client.templates.list()).templates
   } catch (e) {
     throw orpcToCliError(e)
   }
   ```

3. **Drop the manual unwrap.** No more `ORPC_NO_INPUT_BODY` constant — the client builds the body. No more `unwrapOrpc` helper. The client wraps the response in `ORPCError` if the envelope is wrong.

### Phase 2 — typed web client (RSC-aware)

The marketing site has different constraints: Next.js RSC fetches with `next.revalidate` and `next.tags` for ISR. The RPCLink wraps a `fetch` we control, so we can pass `context: { next: { revalidate, tags } }` on each call and read it in `orpcFetch` to forward to the underlying `fetch`.

1. **Add `@orpc/client` to `apps/web/package.json`.**

2. **Create `apps/web/src/lib/orpc.ts`** with the typed client + a custom `fetch` that reads `context.next` and threads it to the global `fetch`. The custom fetch signature is the same 5-arg shape as the CLI.

3. **Rewrite `apps/web/src/lib/templates-api.ts`** to use `client.templates.list()` and drop the manual `ORPC_NO_INPUT_BODY` / `unwrapOrpc`. ISR semantics preserved via the context.

### Phase 3 — test refactor

The current test file mocks `fetch` globally. With RPCLink the wire is fixed (POST, body shape) and the body contract is enforced by the router type. We can rewrite the tests as **server mocks** using `MSW` or a hand-rolled interceptor on the global fetch.

The simpler path for V1: keep mocking `fetch` globally, but expect an oRPC envelope (`{ result: { data: ... } }` or `{ defined: true, code, status, message }`). The current tests do this; they just don't reach the right code path because of the wrapper bug.

### Phase 4 — error taxonomy alignment

Right now our server-side codes live in `packages/api/src/envelope.ts` (`errorBody(c, code, message)`) and our client-side codes live in `apps/cli/src/errors.ts` (`networkError`, `parseError`). They don't share a vocabulary.

Two paths:

- **A**: introduce `errors.ts` in `@workspace/contracts` with the canonical list (network_error, parse_error, not_found, templates_fetch_failed, etc.). Both server and client import from there. One source of truth for codes.
- **B**: keep them separate and document the mapping in the plan. Less coupling, more drift risk.

We pick **A** because the codes cross the wire and we already import the contract shape from `@workspace/contracts`. Adding `errors.ts` there is the natural next step.

### Server-side follow-up (orthogonal to the migration)

While auditing `packages/api/src/index.ts` against the oRPC guide, we noticed we can tighten one thing without scope creep:

- **Document the two `onError` paths** with a comment in `index.ts`. No code change, just makes future contributors aware that oRPC errors are caught by the interceptor and Hono-level errors by `api.onError`. This is the kind of subtle split that gets reintroduced by accident otherwise.

The `apps/app` consumer (`apps/app/lib/orpc.ts`) already uses `RPCLink` without a custom fetch. That's correct for its use case (Next.js Server Components with auth, no CLI-style retry). No change required there.

## Phasing summary

| Phase | Scope | Estimated effort | Risk |
|---|---|---|---|
| 1 — typed CLI client | `apps/cli/src/api.ts` + `apps/cli/src/errors.ts` | half a day | Low: signature is verified, error mapping is local. |
| 2 — typed web client | `apps/web/src/lib/orpc.ts` + `apps/web/src/lib/templates-api.ts` | half a day | Medium: Next.js ISR semantics need careful threading. |
| 3 — test refactor | rewrite `apps/cli/test/unit/api.test.ts` | half a day | Low. |
| 4 — error taxonomy alignment | new `packages/contracts/src/errors.ts` + wiring | one day | Low: additive change. |

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| The `as unknown` cast masked a signature mismatch once. Don't repeat. | The wrapper signature comes from `@orpc/client` directly (no re-declaration), and we add a Vitest test that pins the function arity. |
| `ORPCError.code` strings drift between server and client. | Phase 4 — single source of truth in `@workspace/contracts`. |
| ISR directives stop working when RPCLink wraps fetch. | Phase 2 — thread `next.revalidate` and `next.tags` through the custom `fetch` hook's `options.context`. Verified by hitting the marketing site and inspecting the cache-control header on `app.deessejs.com`. |
| Bumping `@orpc/client` upstream breaks the typed wrapper. | Pin to the catalog version, pin the types we consume, add a smoke test on every dependency bump. |
| Tests still flaky because of the global fetch mock. | Move to MSW in a future PR. Phase 3 keeps global mocking for now to ship. |

## Open questions

- Should we keep the raw-fetch fallback (current behaviour) as an escape hatch in case the typed client misbehaves on a future oRPC upgrade? Currently no.
- Should the `next: { revalidate, tags }` context live in the call site or in the RPCLink itself? We pass it per-call today. Per-call is more explicit.
- Do we want to expose `ORPCError` in the public CLI API (re-export from `@deessejs/errors`)? Useful for downstream plugins but not required for V1.

## Decision log

- **2026-08-10**: decided to commit a checkpoint of the broken RPCLink work rather than discard it. We learned that `RPCLink.fetch` has a 5-arg signature and that `ORPCError.code` is the right surface for our CliError codes. Both lessons are now baked into this plan.
- **2026-08-10**: audited `packages/api/src/index.ts` against the oRPC Hono guide. Current implementation follows the recommended patterns (RPCHandler, body-parser Proxy, prefix, `c.newResponse`, `await next()`). No server-side changes required for the client migration.
