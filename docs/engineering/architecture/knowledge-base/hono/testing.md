# Hono testing

A study of Hono's testing patterns. Built on
[hono.dev/docs/guides/testing](https://hono.dev/docs/guides/testing)
and [hono.dev/docs/helpers/testing](https://hono.dev/docs/helpers/testing)
— the upstream pages are the source of truth when the lib
changes; this entry exists to show the shape of the
integration and the discipline that distinguishes testing
the framework from testing the app.

## `app.request(...)` — the basic test handle

Hono exposes `request` on every app instance. It takes a
path or a `Request` and returns a `Response` — no real
network, no port binding, no listening socket.

```ts
const app = new Hono().get("/posts", (c) => c.text("Many posts"))

test("GET /posts", async () => {
  const res = await app.request("/posts")
  expect(res.status).toBe(200)
  expect(await res.text()).toBe("Many posts")
})
```

Three call shapes:

- `app.request("/path")` — simple GET.
- `app.request("/path", { method, body, headers })` — full
  `RequestInit`.
- `app.request(new Request("http://...", { ... }))` — pass a
  pre-built `Request` (useful when the body is non-trivial,
  e.g. multipart/form-data, or when you need to set a custom
  URL the test cares about).

The third argument accepts an `Env` for bindings injection
(Cloudflare `D1`, `KV`, etc.) — typically not used in a
Node test runtime.

## `testClient` from `hono/testing` — typed test client

Hono also ships a typed test client, `testClient(app)`,
that returns an object mirroring the app's route tree:

```ts
import { testClient } from "hono/testing"

const client = testClient(app)
const res = await client.search.$get({ query: { q: "hono" } })
```

Editor autocompletion includes query parameters, request
body shape, and response type. Useful for E2E tests of a
Hono app where you want a client shape instead of raw
`fetch`.

**Important caveat**: the type inference only works if the
routes are **chained on the Hono instance** in the same
file:

```ts
// Type inference works:
const app = new Hono().get("/search", ...).post("/posts", ...)

// Type inference does NOT work:
const app = new Hono()
app.get("/search", ...)
app.post("/posts", ...)
```

When the app composes routes from factories (a common
pattern for non-trivial apps), `testClient` types as
`Record<string, never>` and is useless. The `app.request(...)`
form is the fallback.

## The discipline: test the app, not the framework

A test that exercises a `new Hono()` with a single route
tests that Hono itself routes correctly. It does not test
that the app's middlewares run, that the composer's
factories mount, that the procedure handler runs, or that
the wire envelope is correct.

The end-to-end pattern, when arrived at, is to export the
real app and call it directly:

```ts
// (sketch, not yet written)
import { api } from "@workspace/api"   // the real Hono app
import { auth as testAuth } from "@workspace/auth/tests/setup"

it("returns the templates to an authenticated caller", async () => {
  const user = await testAuth.$context.then((c) => c.test.createUser())
  const { headers } = await testAuth.$context.then((c) =>
    c.test.login({ userId: user.id }),
  )

  const res = await api.request("/rpc/templates/list", {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ "0": { json: null, meta: [] } }),
  })

  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.result.data.templates).toBeInstanceOf(Array)
})
```

This tests the **real** app, the **real** error handler,
the **real** request-id middleware, the **real** CORS, the
**real** session middleware, the **real** oRPC handler, and
the **real** procedure. The cost is a test database and a
fake external dependency. The benefit is that the test
exercises the wire that ships, end-to-end, without
mocking any of our own code.

## What this entry is not

This is a knowledge-base entry, not an ADR. It documents
how Hono's testing patterns work in the current version of
the lib, and the shape of the integration. The
**decisions** (which patterns we picked and why) live in
`docs/engineering/architecture/decisions/` and
`docs/engineering/architecture/rules/`. When a future
change conflicts with this entry, the entry is wrong, not
the code.
