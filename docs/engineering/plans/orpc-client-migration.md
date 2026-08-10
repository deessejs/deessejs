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
  - id: error-mapping-two-channels
    date: 2026-08-10
    choice: "Map both ORPCError (from procedures) and our errorBody envelope (from Hono middleware) onto CliError codes"
    rationale: "Today, procedures throw ORPCError (e.g. auth middleware), while Hono-level middleware (rate limit, 404, global onError) produce our custom { code, message, requestId } envelope via errorBody(). Until the server side is unified, the client must handle both shapes."
  - id: server-error-unification
    date: 2026-08-10
    choice: "Long-term: throw ORPCError from Hono middleware too, drop errorBody envelope"
    rationale: "The client expects ORPCError on every error path. The Hono middleware (rate limit, 404, onError) currently bypass oRPC by returning a custom JSON envelope. Migrating them to throw ORPCError makes the wire uniform and lets the client catch one error type."
  - id: web-rsc
    date: 2026-08-10
    choice: "Use @orpc/client with custom fetch that threads Next.js ISR directives"
    rationale: "Replaces the verbose direct-fetch + manual unwrap with a typed client. The custom fetch forwards `context.next.revalidate` and `context.next.tags` to the global fetch, preserving ISR semantics that the manual version had."
  - id: hono-audit
    date: 2026-08-10
    choice: "Server-side Hono integration is faithful to the oRPC guide, no changes required for the client-only migration"
    rationale: "Audited against https://orpc.dev/docs/adapters/hono: RPCHandler, body-parser Proxy, prefix, c.newResponse, await next() all in place. The only follow-up is a comment clarifying the two-tier error handling."
---

# Migrate CLI + web to @orpc/client + RPCLink

_Date: 2026-08-10. Status: draft. Working document — not yet approved._

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

### The error model — TWO channels

After deeper investigation, the wire has **two distinct error channels**, and the client has to handle both:

#### Channel 1: `ORPCError` from procedures

`ORPCError` is the error type oRPC throws from procedure handlers. The wire shape is:

```json
{
  "defined": true,
  "code": "UNAUTHORIZED",
  "status": 401,
  "message": "...",
  "data": { ... }
}
```

- `defined: true` → the code is registered in the procedure's errorMap (type-safe).
- `defined: false` → the code is ad-hoc (still works, but client-side validation is off).
- `data` is server-defined (no sensitive data per the docs).
- Standard JS errors thrown from a procedure become `INTERNAL_SERVER_ERROR` automatically.

The client oRPC decodes this shape into a real `ORPCError` class instance and throws it. `instanceof ORPCError` works.

The auth middleware (`packages/api/src/router/middlewares/auth.ts`) already uses this pattern:

```ts
throw new ORPCError("UNAUTHORIZED")
```

#### Channel 2: custom envelope from Hono middleware

The Hono-level middleware (`notFound`, `onError`, rate-limit) currently bypass oRPC and return our custom envelope via `errorBody(c, code, message)`:

```json
{ "code": "not_found", "message": "Route not found", "requestId": "..." }
```

The shape is `{ code, message, requestId }`. The client oRPC **does not decode this** as `ORPCError` — it sees a response without the `{ defined, code, status, message, data }` shape and throws `INTERNAL_SERVER_ERROR` (or similar) with the raw body as `data`.

Consequence: any error coming from a Hono middleware is opaque to the typed client.

### `ClientOptions` argument

The third argument of the `fetch` hook carries `context`, which oRPC also passes through interceptors and plugins. We use it today to send `next.revalidate` and `next.tags` from `apps/web`. On the CLI we have no consumer yet, but the room is there.

### `apps/app` is already on the typed client

`apps/app/lib/orpc.ts` uses `RPCLink` with the default global fetch. No custom retry, no error mapping — errors propagate to the React UI as native thrown `ORPCError`. No changes required there for this migration; it's the reference implementation we pattern-match against.

## Plan

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

2. **Map both error channels to CliError.** Add a small helper next to `networkError` and `parseError` in `apps/cli/src/errors.ts`:

   ```ts
   import { ORPCError } from "@orpc/client"

   /**
    * Map an unknown error from the typed client to a CliError.
    *
    * Two error channels from the server:
    *  1. ORPCError from a procedure — has `code`, `status`, `data`.
    *  2. Custom envelope { code, message, requestId } from a Hono
    *     middleware — not an ORPCError, but parseable as JSON.
    *
    * Network errors (fetch failed) are network_error. Anything we
    * can parse is parse_error. We surface server codes as-is so the
    * user sees the same vocabulary on both sides of the wire.
    */
   export const orpcToCliError = async (
     e: unknown,
     getResponseBody: () => Promise<string>,
   ): Promise<CliError> => {
     if (e instanceof ORPCError) {
       return parseError(`server returned ${e.code}: ${e.data ?? e.message}`)
     }
     // Network error: fetch failed before reaching the server.
     if (e instanceof TypeError) {
       return networkError(e.message)
     }
     // Hono middleware envelope: the client could not decode the
     // response as ORPCError, but the body is a known shape.
     try {
       const body = await getResponseBody()
       const envelope = JSON.parse(body) as { code?: string; message?: string }
       if (envelope?.code) {
         return parseError(`server returned ${envelope.code}: ${envelope.message ?? ""}`)
       }
     } catch {
       // Body was not parseable JSON; fall through to network_error.
     }
     return networkError(e instanceof Error ? e.message : String(e))
   }
   ```

   The `getResponseBody` closure is a small escape hatch: it gives the mapper access to the raw response when oRPC couldn't decode it. In `fetchTemplates` we wire it to the fetch hook's last successful response body.

3. **Drop the manual unwrap.** No more `ORPC_NO_INPUT_BODY` constant — the client builds the body. No more `unwrapOrpc` helper. The client wraps the response in `ORPCError` if the envelope is wrong.

4. **Capture the response body in the fetch hook.** Modify `orpcFetch` to keep the last response body in a closure so the error mapper can read it on decode failure:

   ```ts
   let lastBody = ""
   const orpcFetch: typeof fetch = async (request, init, options, path, input) => {
     const res = await fetchWithRetry(/* map (request, init) to opts */)
     lastBody = res.bodyText
     return new Response(res.bodyText, /* status, headers */)
   }
   ```

   The `orpcToCliError(e, () => lastBody)` call reads this.

### Phase 2 — typed web client (RSC-aware)

The marketing site has different constraints: Next.js RSC fetches with `next.revalidate` and `next.tags` for ISR. The RPCLink wraps a `fetch` we control, so we can pass `context: { next: { revalidate, tags } }` on each call and read it in `orpcFetch` to forward to the underlying `fetch`.

1. **Add `@orpc/client` to `apps/web/package.json`.**

2. **Create `apps/web/src/lib/orpc.ts`** with the typed client + a custom `fetch` that reads `context.next` and threads it to the global `fetch`. The custom fetch signature is the same 5-arg shape as the CLI.

3. **Rewrite `apps/web/src/lib/templates-api.ts`** to use `client.templates.list()` and drop the manual `ORPC_NO_INPUT_BODY` / `unwrapOrpc`. ISR semantics preserved via the context.

4. **Surface errors as a typed result.** The web `fetchTemplates` already returns `FetchTemplatesResult = { ok: true } | { ok: false; error: string }`. Keep that shape but populate `error` from `ORPCError.code` when the client throws.

### Phase 3 — test refactor

The current test file mocks `fetch` globally. With RPCLink the wire is fixed (POST, body shape) and the body contract is enforced by the router type. We can rewrite the tests as **server mocks** using `MSW` or a hand-rolled interceptor on the global fetch.

The simpler path for V1: keep mocking `fetch` globally, but expect an oRPC envelope (`{ result: { data: ... } }` for success, `{ defined: true, code, status, message, data }` for ORPCError). The current tests do this; they just don't reach the right code path because of the wrapper bug.

For the Hono-envelope error channel (Phase 1 step 2), add at least one test that returns `{ code, message, requestId }` and asserts the mapper surfaces it as `parse_error` with the server's code.

### Phase 4 — server-side error unification (long-term)

The Hono middleware currently bypass oRPC. To make the client uniform:

1. **Convert `notFound` and the global `onError` in `packages/api/src/index.ts`** to throw `ORPCError` instead of returning our custom JSON.

2. **Convert the rate-limit middleware** to throw `new ORPCError("RATE_LIMITED", { status: 429, data: { retryAfter: ... } })`. The auth middleware already does this style with `UNAUTHORIZED`.

3. **Define a shared error map** in `packages/api/src/router/index.ts` or a dedicated `errors.ts`:

   ```ts
   const base = os.errors({
     RATE_LIMITED: { data: z.object({ retryAfter: z.number() }) },
     NOT_FOUND: {},
     UNAUTHORIZED: {},
   })
   ```

4. **Delete `packages/api/src/envelope.ts`** once nothing references it. The custom `errorBody` helper becomes dead code.

This phase is **optional for the client migration to land** — the client just needs to handle both channels. But it's the clean end-state and removes the second error path.

### Phase 5 — error taxonomy alignment

Right now our server-side codes live in `packages/api/src/envelope.ts` (`errorBody(c, code, message)`) and our client-side codes live in `apps/cli/src/errors.ts` (`networkError`, `parseError`). They don't share a vocabulary.

Two paths:

- **A**: introduce `errors.ts` in `@workspace/contracts` with the canonical list (network_error, parse_error, not_found, templates_fetch_failed, etc.). Both server and client import from there. One source of truth for codes.
- **B**: keep them separate and document the mapping in the plan. Less coupling, more drift risk.

We pick **A** because the codes cross the wire and we already import the contract shape from `@workspace/contracts`. Adding `errors.ts` there is the natural next step.

## Phasing summary

| Phase | Scope | Effort | Risk |
|---|---|---|---|
| 1 — typed CLI client (two-channel error map) | `apps/cli/src/api.ts` + `apps/cli/src/errors.ts` | 1 day | Low: signature is verified, error mapper handles both channels. |
| 2 — typed web client | `apps/web/src/lib/orpc.ts` + `apps/web/src/lib/templates-api.ts` | half a day | Medium: Next.js ISR semantics need careful threading via `context.next`. |
| 3 — test refactor (Hono envelope coverage) | rewrite `apps/cli/test/unit/api.test.ts` | half a day | Low. |
| 4 — server-side error unification | convert Hono middleware to `ORPCError`, delete `envelope.ts` | 1-2 days | Medium: touches the rate-limit and error middleware. |
| 5 — error taxonomy alignment | new `packages/contracts/src/errors.ts` | 1 day | Low: additive change. |

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| The `as unknown` cast masked a signature mismatch once. Don't repeat. | The wrapper signature comes from `@orpc/client` directly (no re-declaration), and we add a Vitest test that pins the function arity. |
| Hono middleware envelopes look like network errors on the client. | Phase 1 maps both channels. Phase 4 unifies the server side so this becomes moot. |
| `ORPCError.code` strings drift between server and client. | Phase 5 — single source of truth in `@workspace/contracts`. |
| ISR directives stop working when RPCLink wraps fetch. | Phase 2 — thread `next.revalidate` and `next.tags` through the custom `fetch` hook's `options.context`. Verified by hitting the marketing site and inspecting the cache-control header on `app.deessejs.com`. |
| Bumping `@orpc/client` upstream breaks the typed wrapper. | Pin to the catalog version, pin the types we consume, add a smoke test on every dependency bump. |
| Tests still flaky because of the global fetch mock. | Move to MSW in a future PR. Phase 3 keeps global mocking for now to ship. |

## Open questions

- Should we keep the raw-fetch fallback (current behaviour) as an escape hatch in case the typed client misbehaves on a future oRPC upgrade? Currently no.
- Should the `next: { revalidate, tags }` context live in the call site or in the RPCLink itself? We pass it per-call today. Per-call is more explicit.
- Do we want to expose `ORPCError` in the public CLI API (re-export from `@deessejs/errors`)? Useful for downstream plugins but not required for V1.

## Decision log

- **2026-08-10**: decided to commit a checkpoint of the broken RPCLink work rather than discard it. We learned that `RPCLink.fetch` has a 5-arg signature and that `ORPCError.code` is the right surface for our CliError codes. Both lessons are now baked into this plan.
- **2026-08-10**: audited `packages/api/src/index.ts` against the oRPC Hono guide. Current implementation follows the recommended patterns (RPCHandler, body-parser Proxy, prefix, c.newResponse, await next()). No server-side changes required for the client migration.
- **2026-08-10**: confirmed two error channels on the wire — `ORPCError` from procedures (decoded by the typed client) and the custom `{ code, message, requestId }` envelope from Hono middleware (NOT decoded by the typed client). The CLI error mapper must handle both. Long-term: unify server-side by throwing `ORPCError` from Hono middleware too (Phase 4).
