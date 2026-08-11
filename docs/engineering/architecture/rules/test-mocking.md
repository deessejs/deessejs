# Test mocking policy

## Question this doc answers

*What am I allowed to mock, and what am I forbidden to mock?*

## The forbidden patterns

These produce flaky tests, bypass the typed client, or hide real
wire behavior. Banned by review.

### `vi.stubGlobal("fetch", ...)`

Mocks the global `fetch` directly. RPCLink builds a `Request` object
whose body is consumed once. The mock returns a fixed `Response`
regardless of what was requested. The result:

- The typed client never sees the request it would send to the real
  server.
- The retry pipeline in the CLI never gets exercised.
- The envelope unwrap never gets exercised.
- Tests pass even when the wire contract is broken.

If you find yourself reaching for this pattern, you are testing the
mock, not the client. Use Pattern A (Server-Side Client) or Pattern
B (`http.createServer`) instead. See
`docs/engineering/architecture/decisions/`.

### `vi.spyOn` on an exported function to verify it was called

Useful for "did this function get called?" assertions. Forbidden in
this repo because the typed contract already guarantees the call
happens. If you want to verify a side effect, observe the side effect,
not the function call.

### Mocking the database inside a Server-Side Client test

The Server-Side Client test exercises the procedure handler. If the
procedure hits the database, the test hits the database. Use `pg-mem`
(in-memory Postgres) for fast, real tests. If you don't want a real DB
hit, the test belongs in a different layer.

## The allowed patterns

### A — Server-Side Client

```ts
import { appRouter } from "@workspace/api/router"

const result = await appRouter.templates.list()
expect(result.templates).toHaveLength(1)
```

Tests the procedure handler, input/output validation, error map. No
HTTP. The [official oRPC testing pattern](https://orpc.dev/docs/advanced/testing-mocking).

### B — Real HTTP fixture (CLI)

```ts
import { createServer } from "node:http"

const server = createServer((req, res) => {
  // assert req.url, req.headers, etc. here
  res.end(JSON.stringify({ result: { data: { templates: [] } } }))
})
```

Mount on an ephemeral port. Tests the full transport including
`RPCLink`, `orpcFetch`, `fetchWithRetry`, response parsing. No
network.

### C — MSW with `@dansnow/orpc-msw` (web)

```ts
import { createORPCMsw } from "@dansnow/orpc-msw"

const msw = createORPCMsw(appRouter)
msw.templates.list.handler = async () => ({ templates: [] })
```

MSW intercepts the real `fetch` call. Handlers are type-checked
against the router contract.

### D — Mock external services

Mocking Stripe, GitHub API, Resend, or other third-party services in
tests is allowed. Use MSW, nock, or the library's own test helper.
These services are not under our control; we don't want to hit them in
tests. They are not part of the wire contract our app owns.

## Why "mock the function" is not the same as "mock the network"

| Goal                                | Pattern           |
| ----------------------------------- | ----------------- |
| Verify a procedure's behavior        | Server-Side Client |
| Verify the wire envelope            | http.createServer |
| Verify a component renders with data | MSW with orpc-msw |
| Verify a function returned the right thing | Type system    |
| Verify a side effect happened       | Observe the side effect |
| Verify an external API was called    | Spy on the boundary, not the function |

## How reviewers catch violations

1. **CI**: a CI script greps for `vi.stubGlobal` and `vi.spyOn` in
   `test/`. If found, fail with a message pointing to this doc.
2. **AI reviewer**: when the PR adds test files, look for the patterns
   in this doc and flag deviations.
3. **Human reviewer**: this doc is the checklist.

## Anti-patterns (a longer list)

- `vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("...")))`
- `vi.spyOn(fetchWithRetry, "fetchWithRetry")`
- `vi.mock("./api/client")` to bypass the typed client entirely
- `jest.mock(...)` (we use Vitest, same principle)
- Stubbing `globalThis.fetch` in any way

## Where this rule came from

The PR #45 migration of `/templates` spent significant time
debugging tests that used `vi.stubGlobal("fetch", ...)` and produced
mysterious "Cannot parse response body" errors. The mock was at the
wrong layer. The rule exists to prevent recurrence and to give
reviewers a checklist.
