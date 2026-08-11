# Hono middleware

A study of Hono's middleware patterns, pinned to the concrete
files in our app. Built on
[hono.dev/docs/guides/middleware](https://hono.dev/docs/guides/middleware)
— the upstream page is the source of truth when the lib
changes; this entry exists to show what we wired where.

## What a middleware is

A Hono middleware is `async (c, next) => ...` that runs
**before** and **after** a handler. It must `await next()`
unless it returns a `Response` to short-circuit the chain.

```ts
app.use(async (c, next) => {
  // before handler
  await next()
  // after handler
})
```

Three registration shapes:

- `app.use(mw())` — every method, every path.
- `app.use('/posts/*', cors())` — path-scoped.
- `app.post('/posts/*', basicAuth())` — method + path-scoped.

## Execution order

Order is determined by registration order, and the
middleware runs as nested `await next()`:

```
mw1 start
  mw2 start
    mw3 start
      handler
    mw3 end
  mw2 end
mw1 end
```

A throw anywhere in the chain is caught by `api.onError(...)`
if one is registered (and we have one, see
`packages/api/src/middleware/error-handler.ts`). The
`await next()` in upstream middleware never throws.

## The error handler

`app.onError(handler)` is the global catch. It runs after
**any** middleware or handler throws. It is not strictly a
middleware — it is registered with `onError`, not `use` —
but it lives in the same chain conceptually.

```ts
// packages/api/src/middleware/error-handler.ts
api.onError(onApiError)
```

The handler must produce a `Response`. We use it to funnel
every error path into the same wire format
(`{ defined, code, status, message, data }`) so the typed
client decodes every error the same way, including
Hono-level errors that never reached the oRPC procedure.

## Custom middleware in our app

`packages/api/src/middleware/` holds the custom middlewares.
Each is a small module that exports a factory function
returning a `MiddlewareHandler` (or the `MiddlewareHandler`
itself for stateless cases). The folder is the place for
**HTTP-level** concerns only — oRPC procedure-level
concerns live in `packages/api/src/router/procedures/`.

| File | Purpose | Where it runs |
|---|---|---|
| `error-handler.ts` | Funnels every error into the ORPCError wire shape | `api.onError(...)` |
| `request-id.ts` | Mints `X-Request-Id`, sets `c.var.requestId`, echoes the header | `api.use("*", ...)` |
| `session.ts` | Calls Better Auth, sets `c.var.user` and `c.var.session` | `api.use("*", ...)` |
| `cors.ts` (via `hono/cors`) | CORS headers, validated `ALLOWED_ORIGINS` | `api.use("*", ...)` |
| `secure-headers.ts` (via `hono/secure-headers`) | HSTS, nosniff, CSP defaults | `api.use("*", ...)` |
| `rate-limit.ts` | Per-IP fixed-window rate limit | Per-route, e.g. `/cli-version` |
| `etag.ts` | Weak ETag handler, opt-in per route | Per-route, when needed |

The composition order in `packages/api/src/index.ts`:

```ts
api.onError(onApiError)            // catch-all, runs first
api.use("*", requestId())          // sets c.var.requestId
api.use("*", secureHeaders())      // cheap hardening
api.use("*", cors({ ... }))        // CORS, before auth routes
api.use("*", honoLogger())         // logs request, after requestId
api.use("*", session())            // populates c.var.user/session
```

Order matters: `onError` before any middleware that might
throw; `requestId` before anything that logs; `session`
before any route that reads `c.var.user`. The current order
is correct.

## `createMiddleware` for reusable middleware

Hono's `createMiddleware` factory is the recommended way to
extract middleware with type safety. We do **not** use it
because our middlewares are simple enough that inlining the
generic is the same cost as the indirection:

```ts
// Current (fine for our scale)
export const session = (): MiddlewareHandler => async (c, next) => { ... }

// If we ever need to type the Env explicitly
import { createMiddleware } from "hono/factory"
const session = createMiddleware<ApiEnv>(async (c, next) => { ... })
```

The second form buys us nothing today because the `c`
parameter is already typed by Hono's inference from
`new Hono<ApiEnv>()`. We will switch when a middleware
needs an explicit `Env` that differs from the app's.

## What this entry is not

This is a knowledge-base entry, not an ADR. It documents how
Hono middleware patterns work in the current version of the
lib, and where each piece lives in our repo. The
**decisions** (which patterns we picked and why) live in
`docs/engineering/architecture/decisions/` and
`docs/engineering/architecture/rules/`. When a future
change conflicts with this entry, the entry is wrong, not
the code.
