# ADR-002: Typed client via RPCLink

## Status

Accepted (2026-08).

## Context

The CLI and the marketing site need to consume the templates registry
and other oRPC procedures. Three options were considered:

1. **Direct `fetch` + manual envelope unwrap**: small, no new
   dependencies, but the wire shape (`{ result: { data: ... } }`)
   has to be parsed manually. Error envelopes have to be detected by
   shape-matching the response body.
2. **`@orpc/client` + `RPCLink`**: typed `RouterClient<typeof appRouter>`,
   auto-unwraps the envelope, decodes `ORPCError` from the wire shape.
3. **`@orpc/client` + `OpenAPIHandler` server-side**: a parallel
   OpenAPI surface for third-party consumers. Out of scope for V1.

## Decision

**Option 2: `@orpc/client` + `RPCLink` everywhere a consumer app
talks to `packages/api`.**

The custom `fetch` hook on the link carries app-specific concerns:
ISR (web), retry (CLI), nothing (app). The procedure contract is
identical.

## Consequences

- The contract Zod schemas (`packages/contracts/src/v1/`) are the
  source of truth for inputs and outputs. Any divergence between the
  schema and the router breaks the consumer's `pnpm typecheck`.
- Each app has its own `src/lib/orpc.ts` wrapper. Wrappers are not
  shared between apps. See `architecture/clients.md`.
- Adding a procedure to `appRouter` automatically propagates type
  inference to every consumer. No client code changes.
- Test pattern: `appRouter.X()` direct (Server-Side Client) for
  contract, real `http.createServer` for the HTTP layer, MSW with
  `@dansnow/orpc-msw` for component tests. See `../rules/test-mocking.md`.

## What this ADR does not allow

- **Sharing the `orpc.ts` wrapper across apps via a `@workspace/api-client`
  package**: each app's wrapper is ~30 lines and carries app-specific
  concerns. Abstraction is more expensive than duplication here.
- **Generating the client from OpenAPI**: the typed client already
  exists via `RouterClient`. Adding OpenAPI would mean having two
  type sources for the same procedures, which drift. OpenAPI is
  appropriate when external consumers need it; until then, the
  typed client is the single source of truth.
- **Replacing Hono's `basePath` mount with a per-app handler**: the
  catch-all in `apps/app/app/api/[[...route]]/route.ts` already
  forwards everything to Hono. Per-app Hono mounts would duplicate
  routing without adding capability.

## Migration note

Any historical detail about how a previous code path looked is not
captured here. An ADR describes what the system **is**, not what it
**was**. The git log holds the history.

If you find yourself writing "before this ADR was accepted, the
system did X" in any doc, stop. Move that detail to a commit
message or a retrospective — not the ADR.
