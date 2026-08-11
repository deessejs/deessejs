# oRPC middleware

A study of oRPC's middleware patterns, pinned to the concrete
files in our app. Built on
[orpc.dev/docs/middleware](https://orpc.dev/docs/middleware)
— the upstream page is the source of truth when the lib
changes; this entry exists to show what we wired where.

## What an oRPC middleware is

An oRPC middleware is a function on a procedure builder
that runs before and after a handler. It can:

- Inspect or reject the input.
- Inject or guard the context.
- Transform the output (caching, redaction, etc.).

```ts
const authMiddleware = os
  .$context<{ something?: string }>()
  .middleware(async ({ context, next }) => {
    // before handler
    const result = await next({
      context: { user: { id: 1, name: "John" } },
    })
    // after handler
    return result
  })
```

The shape is `({ context, next }) => Promise<result>`. The
`next({ context })` call forwards and may inject additional
context values that downstream handlers see as
`context.user`, `context.something`, etc.

## Chaining with `.use()`

Multiple middlewares chain with `.use()`. The order is
left-to-right:

```ts
const protectedBase = base
  .use(settingMw)      // runs first
  .use(authMw)         // runs second
  .handler(async () => { ... })
```

The combined context is the union of every `next({ context })`
along the chain. A handler downstream sees everything
injected by upstream middlewares.

## Our `authGuard` middleware

`packages/api/src/router/procedures/auth-middleware.ts` is
our one oRPC middleware. It guards a procedure by requiring
`context.user` and `context.session` to be set, and
narrows the type for the downstream handler.

```ts
export const authGuard = base.middleware(async ({ context, next }) => {
  if (!context.user || !context.session) {
    throw new ORPCError("UNAUTHORIZED")
  }

  return next({
    context: {
      ...context,
      user: context.user,
      session: context.session,
    },
  })
})
```

The narrowed type for downstream handlers is inferred by
oRPC from the non-null assertion in the guard — there is
no `as AuthContext` cast. (The cast was removed in a prior
commit; see `decisions/` for the why.) The base context
type comes from `os.$context<BaseContext>()` in
`router/procedures/base.ts`.

`authGuard` is currently **orphaned** in the sense that no
router uses it (we removed the dummy `user.ts` routes).
It exists for the next protected procedure that needs it.
Per ADR-002, dead code is not removed when it is
**anticipated** to be needed soon; we keep it in place so
the next protected procedure can use the established
pattern without re-deriving it.

## `$context` — the dependent context

Before `.middleware`, you can call `.$context<{ ... }>()` to
declare that the procedure needs certain context values.
The middleware that provides those values must run
upstream.

```ts
// base.ts
export const base = os.$context<BaseContext>()
```

`BaseContext` is our Hono-shared type. The values
(`requestId`, `user`, `session`) are populated by the
Hono-level session middleware (see
[better-auth + Hono integration](../better-auth/hono-integration.md)).

## Built-in middlewares

oRPC ships `onError`, `onStart`, `onSuccess`, `onFinish` —
the lifecycle interceptors. We use `onError` on the
`RPCHandler` to log every procedure-level error to our
structured logger:

```ts
// packages/api/src/router/procedures/mount.ts
const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [onError((error) => logger.error("orpc_error", error))],
})
```

The `onError` here catches errors that escape the procedure
handler, not the oRPC `ORPCError` thrown intentionally —
those are surfaced to the client as-is.

## What this entry is not

This is a knowledge-base entry, not an ADR. It documents how
oRPC middleware patterns work in the current version of the
lib, and where each piece lives in our repo. The
**decisions** (which patterns we picked and why) live in
`docs/engineering/architecture/decisions/` and
`docs/engineering/architecture/rules/`. When a future
change conflicts with this entry, the entry is wrong, not
the code.
