# ADR-015: Typed client via RPCLink

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

## What we are not doing in V1

- **Sharing the `orpc.ts` wrapper across apps via a `@workspace/api-client`
  package**: each app's wrapper is ~30 lines and carries app-specific
  concerns. Abstraction is more expensive than duplication here.
- **Generating the client from OpenAPI**: the typed client already
  exists via `RouterClient`. Adding OpenAPI would mean we have two
  type sources for the same procedures, which drift. Wait until we have
  external consumers who need OpenAPI.
- **Replacing Hono's `basePath` mount with a per-app handler**: the
  catch-all in `apps/app/app/api/[[...route]]/route.ts` already
  forwards everything to Hono. No per-app Hono mounts.

## Migration note

Before this ADR was accepted, the CLI used direct `fetch` + manual
envelope unwrap. That code worked but lost type safety on responses.
The migration to `RPCLink` is captured in commits on
`feat/templates` and the plan `orpc-client-migration.md`. Tests that
mocked the global `fetch` were removed; contract tests use the
Server-Side Client pattern.
