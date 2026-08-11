# Hono testing

A study of the Hono testing patterns, pinned to what we have
and what we do not. Built on
[hono.dev/docs/guides/testing](https://hono.dev/docs/guides/testing)
and
[hono.dev/docs/helpers/testing](https://hono.dev/docs/helpers/testing)
— the upstream pages are the source of truth when the lib
changes; this entry exists to show what we wired where, and
the one place we are using the pattern wrong.

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
(Cloudflare `D1`, `KV`, etc.) — we do not use this in the
current tests because we are not on Cloudflare Workers. The
default Node test runtime does not need it.

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

This is relevant to us because our `index.ts` does not chain
routes — it composes the app from `mountHttp(api)` and
`mountRpc(api)` calls. The `testClient` would type as
`Record<string, never>` against our app, which makes it
useless. Either we restructure `index.ts` to chain routes
(against the current pattern), or we use the
`app.request(...)` form everywhere and skip `testClient`.

The oRPC layer has its own typed client
(`createORPCClient`), which is what we should use for
testing the oRPC surface — see
`orpc-testing-mocking.md`. The Hono `testClient` is a
fallback for the non-oRPC routes (`/health`, `/ready`,
`/cli-version`, `/auth/*`), and those are simple enough
that `app.request(...)` is fine.

## What we have today

`packages/api/tests/routes.test.ts` uses the `app.request`
pattern — but against a **local `new Hono()`** with a
single route, not against the real `api` exported from
`packages/api/src/index.ts`. The test verifies that Hono
itself routes correctly. It does not verify that **our**
app routes correctly, that our middlewares run, or that
the oRPC handler mounts.

This is the same gap surfaced during the PR #45 review:
the only file in `packages/api/tests/` that touches
`/api/v1/rpc/templates/list` is the CLI-side integration
test, which talks to a fake server, not the real one.

## What an end-to-end test would look like

The intended pattern, when we get there, is to export the
real `api` and call it directly:

```ts
// packages/api/tests/templates-list.test.ts (sketch, not yet written)
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

This goes through the **real** `app.onError`,
`requestId`, `secureHeaders`, `cors`, `session`, the real
`/rpc/*` mount, the real `wrapForOrpc` Proxy, the real
`RPCHandler`, the real `templates.list` procedure, and the
real `enrich()` function (which still calls GitHub, so
the context-injection pattern from `orpc-testing-mocking.md`
applies here too).

The cost is a test database + a fake GitHub client. The
benefit is that we test the actual wire that ships, end to
end, without mocking any of our own code.

## What this entry is not

This is a knowledge-base entry, not an ADR. It documents how
Hono's testing patterns work in the current version of the
lib, and where each piece lives in our repo. The
**decisions** (which patterns we picked and why) live in
`docs/engineering/architecture/decisions/` and
`docs/engineering/architecture/rules/`. When a future
change conflicts with this entry, the entry is wrong, not
the code.
