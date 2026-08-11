# Glossary

Terms that have a specific meaning in this repo. If you see a term in
the code and you're not sure what it means, check here first.

## appRouter

The aggregated oRPC router definition, exported from
`packages/api/src/router/index.ts`. The single source of truth for
what the server exposes. Every consumer derives its typed client from
`RouterClient<typeof appRouter>`.

## body parser proxy

The `Proxy` wrapper around `c.req.raw` in `packages/api/src/index.ts`.
Forwards body-parser methods (`arrayBuffer`, `blob`, `formData`,
`json`, `text`) to Hono's parsed getters. Required by the oRPC Hono
adapter to avoid the "Body Already Used" error when other middleware
reads the body before oRPC. See the
[oRPC Hono docs](https://orpc.dev/docs/adapters/hono).

## CLI_MIN_SUPPORTED

Minimum version of the CLI the server accepts. Below this, the
server responds with a 426 or a version-too-old error and the CLI
refuses to proceed. Set in `packages/api/src/cli-version.ts`. Bumped
when a CLI release removes a feature the server still expects.

## CLI_VERSION

Current CLI version, set in `packages/api/src/cli-version.ts`. The
`/cli-version` endpoint returns this. The CLI compares its own
version against `CLI_MIN_SUPPORTED` on startup and warns the user.

## CLI wire format

JSON envelope used by oRPC: `{ result: { data: ... } }` for success,
`{ defined: false, code: "...", status: ..., message: "...", data: {} }`
for `ORPCError`. See `decisions/ADR-016-orpcerror-wire-format.md`.

## fetchWithRetry

The CLI's retry/backoff/429-aware fetch wrapper at
`apps/cli/src/fetch-with-retry.ts`. Used as the underlying `fetch`
for the CLI's `RPCLink` instance. Honors `X-RateLimit-Reset` when
present and applies jittered exponential backoff on transient
failures.

## ISR

Incremental Static Regeneration. Next.js App Router's data cache
mechanism. Configured per request via `init.next.revalidate` and
`init.next.tags`. Read directly by Next.js from the standard `fetch`
extension — no abstraction layer. See `architecture/clients.md`.

## layer

Editorial tag on each template registry entry. One of
`open-community`, `pro`, or `enterprise`. Set in
`packages/api/src/templates.ts`. Not fetched from GitHub — it's a
business decision, not a property of the repo.

## MCP

Mock Service Worker. Used in `apps/web` (future) for component
tests via `@dansnow/orpc-msw`. The handler is type-checked against
the router contract. See `decisions/ADR-017-testing-strategy.md`.

## orpc

The shared `createORPCClient(RPCLink({ ... }))` instance exported
from each consumer app's `src/lib/orpc.ts`. The marketing site, the
product, and the CLI each have their own. The wrapper carries
app-specific concerns (ISR, retry, env).

## orpcFetch

The custom `fetch` hook passed to `RPCLink`. Five-argument signature
`(request, init, options, path, input) => Promise<Response>` from
`@orpc/client/adapters/fetch/index.d.ts`. The CLI wraps it around
`fetchWithRetry`. The web app wraps it with ISR directives. The
product doesn't customize it.

## ORPCError

The standard oRPC error class. Has `code`, `status`, `message`,
`data`, `defined`. The wire format `{ defined, code, status, message,
data }` decodes into an instance of this class on the client.
Forbidden: throw `ORPCError` with `defined: true` from Hono
middleware (only procedures can do that).

## RouterClient

TypeScript type from `@orpc/server`, derived from the router:
`RouterClient<typeof appRouter>`. The producer side of the typed
client. Each consumer's `orpc` is an instance of `RouterClient`.

## RPCLink

The oRPC client adapter from `@orpc/client/fetch`. Translates
procedure calls into HTTP requests and decodes responses. The custom
`fetch` hook on the link carries app-specific concerns. Always
pointed at `API_RPC_PATH` from `@workspace/api/base-path`.

## Server-Side Client

The test pattern of calling `appRouter.X()` directly, without HTTP.
Tests the procedure handler, input/output validation, and error
map. The [official oRPC testing pattern](https://orpc.dev/docs/advanced/testing-mocking).
Forbidden: try to test the wire with this pattern — that's a
different layer.

## services/

`packages/api/src/services/`. Business logic. Talks to the database,
to GitHub, to Resend. Knows nothing about HTTP, oRPC, or RPC.
Procedure handlers in `router/` delegate to services. The services
directory is the place for code that does work but doesn't speak
HTTP.

## shape matching

The pattern used by `orpcToCliError` (CLI) and the client's
`decode` (oRPC internal) to recognize an `ORPCError` by its wire
shape rather than by `instanceof`. Used because the client may
live-load a different version of `@orpc/client` than the one we
import for the type, breaking `instanceof`. Shape matching is
robust to that.

## templates-fetcher

`packages/api/src/services/templates-fetcher.ts`. The single source
of GitHub access for the templates registry. Called by the
`templates.list` procedure in `router/templates.ts`. Fetches
metadata for each registry entry in parallel. Returns enriched
templates with `name`, `description`, `license`, `labels`,
`updatedAt`, `stars`, `readme`. Fails loud on rate-limit or
downtime.

## union of keys

The strict shape validation done by oRPC's `isORPCErrorJson`. The
wire format must have exactly these keys, in this order: `defined`,
`code`, `status`, `message`, `data`. Any extra or missing key
breaks the decoder, and the client throws
`ORPCError("INTERNAL_SERVER_ERROR")` instead of decoding.
