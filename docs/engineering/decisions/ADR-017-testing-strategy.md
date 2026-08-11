# ADR-017: Testing strategy for the RPC stack

## Status

Accepted (2026-08).

## Context

The RPC stack has three layers:

1. **Procedure handler** (Zod input → service call → Zod output).
2. **HTTP transport** (RPCLink → fetch → body → envelope → typed
   result).
3. **Consumer** (call site, error handling, UI rendering).

Three test patterns were considered:

1. **Mock the global `fetch`**: a `vi.stubGlobal("fetch", ...)` returns
   fixed `Response` objects. Cheap to write, but RPCLink builds a
   `Request` whose body is consumed once. The mock ends up
   bypassing RPCLink entirely, defeating the purpose of testing the
   typed client.
2. **Server-Side Client**: call `appRouter.X()` directly. Tests the
   procedure handler, input/output validation, and error map. No
   HTTP. This is the [official oRPC testing pattern](https://orpc.dev/docs/advanced/testing-mocking).
3. **Real HTTP server**: mount a `http.createServer` (CLI) or MSW
   (web) on an ephemeral port. Tests the full stack including
   `RPCLink` and the wire format.

## Decision

**Pattern A — Server-Side Client for procedure contract.**
**Pattern B — Real HTTP fixture for the transport layer.**
**Pattern C — MSW with `@dansnow/orpc-msw` for component tests.**

What we explicitly do NOT do:

- **Mock `globalThis.fetch` with `vi.stubGlobal`**: bypasses RPCLink,
  produces flaky tests, hides the real wire behavior. Banned by
  review. See `rules/test-mocking.md`.

## Pattern A — Server-Side Client

```ts
import { appRouter } from "@workspace/api/router"
import { describe, it, expect } from "vitest"

describe("templates.list", () => {
  it("returns the curated registry", async () => {
    const result = await appRouter.templates.list()
    expect(result.templates).toHaveLength(1)
    expect(result.templates[0]?.slug).toBe("saas-starter")
  })
})
```

Used in `apps/cli/test/contract/orpc-to-cli-error.test.ts` and any
test that exercises procedure contract, error map, or middleware
chain. No HTTP. No fetch.

## Pattern B — Real HTTP fixture (CLI)

```ts
import { createServer } from "node:http"

const server = createServer((req, res) => {
  res.statusCode = 200
  res.setHeader("content-type", "application/json")
  res.end(JSON.stringify({ result: { data: { templates: [] } } }))
})

await new Promise((resolve) =>
  server.listen(0, "127.0.0.1", resolve),
)
const port = (server.address() as AddressInfo).port
const url = `http://127.0.0.1:${port}`

const templates = await fetchTemplates(url)
expect(templates).toEqual([])
```

Tests the full CLI stack: `fetchTemplates` → `RPCLink` →
`orpcFetch` → `fetchWithRetry` → `Response` → JSON parse → Zod. The
fixture is local; no network.

## Pattern C — MSW with `@dansnow/orpc-msw` (web)

```ts
import { createORPCMsw } from "@dansnow/orpc-msw"
import { appRouter } from "@workspace/api/router"

const msw = createORPCMsw(appRouter)

beforeAll(() => msw.listen())
afterAll(() => msw.close())

it("renders templates", async () => {
  msw.templates.list.handler = async () => ({
    templates: [{ slug: "x", name: "X", /* ... */ }],
  })
  // render the React component, MSW intercepts the RPCLink call
})
```

The MSW handler is type-checked against the router contract. Adding
a field to `TemplateV1` flags every test that needs updating.

## Consequences

- Test files in `apps/cli/test/contract/` exercise the procedure
  contract via Server-Side Client.
- Test files in `apps/cli/test/http/` exercise the transport layer
  via `http.createServer`.
- Test files in `apps/web/` (when added) exercise component behavior
  via MSW with `@dansnow/orpc-msw`.
- The `vi.stubGlobal("fetch", ...)` pattern is banned. Reviewers
  flag any PR that introduces it.
- Adding a new error code to the procedure error map propagates to
  the Server-Side Client tests automatically (TypeScript flags the
  case statement).
- Adding a new procedure does not require a test file in the same
  PR. The contract test is added when the procedure's behavior is
  stable, not at first commit.

## Anti-patterns

- `vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(...)))`
  for RPCLink tests. Banned.
- Mocking the database inside a Server-Side Client test to test
  service logic. The service should be tested with a real or
  in-memory DB (`pg-mem`).
- Adding MSW to a Node test that doesn't render components. Use
  Server-Side Client + `http.createServer` instead.
