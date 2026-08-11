# oRPC Testing & Mocking

A study of the official oRPC testing patterns, pinned to our
concrete setup. Built on
[orpc.dev/docs/advanced/testing-mocking](https://orpc.dev/docs/advanced/testing-mocking)
— the upstream page is the source of truth when the lib
changes; this entry exists to show what we use, what we
deliberately diverge from, and which tests are not yet
written.

## Server-Side Client — `call`

The official pattern for testing a procedure in isolation.
No HTTP, no transport, no RPC envelope. The procedure is
invoked as a function with its input; the output is what the
client would see after the wire.

```ts
import { call } from "@orpc/server"
import { appRouter } from "@workspace/api/router"

it("returns the templates from the registry", async () => {
  const result = await call(appRouter.templates.list, undefined)
  expect(result.templates).toHaveLength(1)
})
```

This is the same pattern as `rules/0001-project-mindset.md`
applied to procedure-level testing.
It exercises the procedure handler, the input/output Zod
schemas, the error map, and any oRPC middleware in the
chain. It does not exercise HTTP, the wire envelope, or the
typed client wrapper. Those are tested at a different layer.

## Overriding context in tests

When the procedure reads dependencies from the oRPC context
(e.g. a GitHub client, the database, the request ID), the
test passes a fake context via the third argument of `call`:

```ts
import { call } from "@orpc/server"
import { appRouter } from "@workspace/api/router"
import type { GitHubClient } from "@workspace/api/core/github/client"

it("returns enriched templates", async () => {
  const fakeGithub: GitHubClient = {
    fetchRepo: async () => ({ name: "saas-template", /* ... */ }),
    fetchReadme: async () => "# README",
  }

  const result = await call(appRouter.templates.list, undefined, {
    context: {
      headers: new Headers(),
      user: null,
      session: null,
      requestId: "test",
      github: fakeGithub,
    },
  })

  expect(result.templates).toHaveLength(1)
})
```

This is the oRPC-native way to inject fakes. The procedure
does not know it is being tested; the test does not need
`vi.mock` or a network fixture. The cost is that the
procedure must **accept its dependencies from the context**
rather than import them statically. See
`packages/api/src/core/templates/enrich.ts` for an example
where the GitHub client is the only external dependency, and
where static `import` would defeat testability.

## Implementer — `implement`

The official pattern for **replacing** a procedure with a
fake during a test, useful for contract-first development or
for mocking the backend from a frontend test.

```ts
import { implement, unlazyRouter } from "@orpc/server"

const fakeListPlanet = implement(router.planet.list).handler(() => [])

// fakeListPlanet replaces the real procedure
```

The `implement` function does not support lazy routers —
`unlazyRouter` converts the router before implementing. We do
not currently use this pattern in the backend; our tests
exercise the real procedure. We may use it later for
frontend tests that need a typed but non-functional
backend.

## What we forbid — beyond what oRPC forbids

The oRPC docs do not explicitly forbid mocking the global
`fetch`, but they lean toward the server-side client because
it tests the procedure in isolation. The project-wide policy
makes that **binding** and adds explicit bans:

- `vi.stubGlobal("fetch", ...)` — bypasses RPCLink, the
  retry pipeline, and the envelope unwrap. The typed client
  never sees the request. Banned.
- `vi.spyOn` on an exported function — the typed contract
  already guarantees the call. Banned.
- Mocking the database inside a Server-Side Client test — the
  test exercises the procedure handler, which should hit the
  real DB (or `pg-mem` for fast integration).

The only mocks we allow are **external services we do not
control** (Stripe, GitHub, Resend) via MSW, nock, or the
library's own test helper. For procedures that consume
external services, we use **context injection** (see above)
so the fake is a typed object, not a network intercept.

## What we have not yet written

The current test suite for `packages/api` covers:

- `validation.test.ts` — Zod schemas (some orphaned after the
  `user.ts` removal; needs cleanup).
- `routes.test.ts` — Hono routing patterns (test the
  framework, not our code).
- `cache-and-rate-limit.test.ts` — middlewares.
- `observability.test.ts` — request ID propagation.

We do **not** yet have a test for the `templates.list`
procedure end-to-end via the server-side client. The patterns
above (`call` with a fake `GitHubClient` in context) are the
intended approach; they have not been written yet. This is
the same gap surfaced during the PR #45 review.

## What this entry is not

This is a knowledge-base entry, not an ADR. It documents how
oRPC testing patterns work in the current version of the lib,
and where each piece lives in our repo. The **decisions**
(which patterns we picked and why) live in
`docs/engineering/architecture/decisions/` and
`docs/engineering/architecture/rules/`. When a future
change conflicts with this entry, the entry is wrong, not
the code.
