# oRPC Hono adapter

A study of how the oRPC `RPCHandler` is mounted inside the Hono
app, pinned to the concrete files in this repo. Built on
[orpc.dev/docs/adapters/hono](https://orpc.dev/docs/adapters/hono)
— the upstream page is the source of truth when the lib changes;
this entry exists to show what we wired where, and the one place
we deliberately diverge from the upstream example.

## Basic mount

The adapter exposes a `RPCHandler` (from `@orpc/server/fetch`)
that takes a `Request` and returns either a `Response` (if a
route matched) or a `matched: false` flag. The Hono app
dispatches the result through the normal middleware chain.

```ts
// packages/api/src/router/procedures/mount.ts
import { onError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/fetch"
import type { Hono } from "hono"

export const mountRpc = (api: Hono<ApiEnv>): void => {
  const rpcHandler = new RPCHandler(appRouter, {
    interceptors: [onError((error) => logger.error("orpc_error", error))],
  })

  api.use("/rpc/*", async (c, next) => {
    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      prefix: "/rpc",
      context: { /* request-scoped values */ },
    })

    if (matched) {
      return c.newResponse(response.body, response)
    }
    await next()
  })
}
```

The `api.use(...)` + `await next()` pattern is what allows
unmatched paths to fall through to other middlewares (e.g. the
not-found handler). Short-circuiting on the `use` itself would
break that.

`interceptors` is the oRPC error pipeline — every error raised
inside a procedure passes through it. We log via the structured
logger so the request ID from the previous middleware layer is
attached.

## Body parser Proxy — "Body Already Used"

If a Hono middleware **before** the oRPC handler reads the
request body (e.g. the logger, the rate limiter, anything that
calls `c.req.json()` or `c.req.text()`), the body is consumed
once. oRPC then sees a drained stream and throws.

The adapter's recommended fix is a `Proxy` that intercepts
the body-parser methods on the raw `Request` and delegates
them to Hono's parsed getters — so the body is parsed once,
cached by Hono, and re-readable by oRPC.

```ts
// packages/api/src/router/procedures/hono-adapter.ts
import type { Context } from "hono"

const BODY_PARSER_METHODS = new Set([
  "arrayBuffer", "blob", "formData", "json", "text",
] as const)
type BodyParserMethod =
  (typeof BODY_PARSER_METHODS extends Set<infer T> ? T : never)

export const wrapForOrpc = (c: Context): Request =>
  new Proxy(c.req.raw, {
    get(target, prop) {
      if (typeof prop === "string" && BODY_PARSER_METHODS.has(prop as BodyParserMethod)) {
        switch (prop) {
          case "arrayBuffer": return () => c.req.arrayBuffer()
          case "blob":        return () => c.req.blob()
          case "formData":    return () => c.req.formData()
          case "json":        return () => c.req.json()
          case "text":        return () => c.req.text()
        }
      }
      return Reflect.get(target, prop, target)
    },
  })
```

The Proxy is the entire reason `hono-adapter.ts` exists as
its own file — it is pure adapter machinery, not application
logic. It is imported by `mount.ts` and applied right before
`rpcHandler.handle(...)`:

```ts
const request = wrapForOrpc(c)
const { matched, response } = await rpcHandler.handle(request, { ... })
```

The current code keeps the Proxy unconditionally because
`honoLogger()` and `rateLimit()` both run before the oRPC
handler — keeping the Proxy in the path is cheaper than
proving the body is never read upstream. If a future refactor
moves the logger and rate limiter behind the oRPC dispatch,
the Proxy can be removed and the upstream basic form restored.

## Divergence: rewriting the `X-Request-Id` response header

The upstream basic example returns `c.newResponse(response.body, response)`
— the `Response` is passed as-is. Our `mount.ts` does:

```ts
const headers = new Headers(response.headers)
headers.set(REQUEST_ID_HEADER, c.get("requestId"))
return c.newResponse(response.body, { ...response, headers })
```

Reason: oRPC constructs the response internally and does not
know about the request ID we mint in `middleware/request-id.ts`.
The header is needed on the wire so clients can correlate a
failure to a request in our server logs. `...response` spreads
the `status`, `statusText`, and any other `ResponseInit`
fields; the explicit `headers` override is the only field we
change.

This divergence is intentional and lives in `mount.ts`, not
in `hono-adapter.ts` — the adapter is upstream-faithful; the
header rewrite is our concern.

## Initial context

The `context` object passed to `rpcHandler.handle(...)` is
the per-request initial context that becomes the oRPC
procedure's `context` argument. We pass:

```ts
context: {
  headers: c.req.raw.headers,
  user: c.get("user"),
  session: c.get("session"),
  requestId: c.get("requestId"),
}
```

- `headers` — needed for any procedure that needs to read
  cookies, the `Authorization` header, or `X-Request-Id` for
  cross-system correlation.
- `user` / `session` — populated by the session middleware
  (see `better-auth-hono-integration.md`).
- `requestId` — populated by the request ID middleware,
  reused for structured logging on the error path.

## What this entry is not

This is a knowledge-base entry, not an ADR. It documents how
the oRPC Hono adapter works in the current version of the lib,
and where each piece lives in our repo. The **decisions**
(which pattern we picked and why) live in
`docs/engineering/architecture/decisions/`. When a future
change conflicts with this entry, the entry is wrong, not
the code.
