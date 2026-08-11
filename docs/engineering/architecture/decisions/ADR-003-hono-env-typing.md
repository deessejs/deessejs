# ADR-003: Hono env typing is per-app, not global

## Status

Accepted (2026-08). Non-negotiable.

## Context

Hono offers two ways to type `c.var`:

1. **Per-app `Variables` generic** on `new Hono<E>()`. Typing
   is scoped to that specific app instance. A `c.get("user")`
   on a different `Hono` instance is untyped.

2. **Global `ContextVariableMap` augmentation** via
   `declare module "hono"`. Typing is added to every `Hono`
   context in the process, regardless of which app owns the
   variable.

Global augmentation is the path of least resistance when a
team has one Hono app. The temptation is to declare the
variables once, at the top of the project, and let TypeScript
carry them everywhere.

## The problem with global augmentation

The Hono docs are explicit
([hono.dev/docs/api/context](https://hono.dev/docs/api/context)):

> `ContextVariableMap` augments types globally — every
> context sees the keys, even where the setting middleware
> never ran. Prefer the per-app `Variables` generic unless
> the variable is guaranteed app-wide.

Concretely: if `requestId` is in `ContextVariableMap`, a
test that does `new Hono()` and calls `c.get("requestId")`
compiles cleanly. At runtime the value is `undefined`. The
type lied.

In DeesseJS the variables are set by middleware that runs
**inside the Hono app** (`middleware/session.ts`,
`middleware/request-id.ts`). A new `Hono` instance — in a
test, in a sub-router, in a side-channel — does not have
those middlewares. The global augmentation claims it does.

The `?? "unknown"` fallbacks in `error-handler.ts` and
`rate-limit.ts` are honest: `api.onError` runs **before**
`requestId()`, so `c.var.requestId` is genuinely `undefined`
at that point. With global augmentation those fallbacks
are required because the type lies. With per-app typing
they are required because the type is honest.

## Decision

The Hono environment is typed per-app. `ApiEnv["Variables"]`
in `packages/api/src/types/api-env.ts` is the single source
of truth. `new Hono<ApiEnv>()` is instantiated exactly once,
in `packages/api/src/index.ts`. The rest of the code imports
`ApiEnv` when it needs to type a `Context` or a middleware
parameter.

There is no `hono-augment.ts` (or `.d.ts`) in this repo.
Any new file that does `declare module "hono"` for the
purpose of adding `Variables` is rejected.

## How to type a custom middleware

When writing a middleware that reads or writes a variable
on the request context, import `ApiEnv` and pass it to the
generic:

```ts
import { createMiddleware } from "hono/factory"
import type { ApiEnv } from "../types/api-env.js"

export const authGuard = createMiddleware<ApiEnv>(async (c, next) => {
  if (!c.var.user) throw new ORPCError("UNAUTHORIZED")
  await next()
})
```

Or, when using a `MiddlewareHandler` directly, take the
context as a parameter typed by Hono's inference:

```ts
export const session = (): MiddlewareHandler => async (c, next) => {
  // c is typed as Context<ApiEnv> because the Hono instance
  // we are registered on is new Hono<ApiEnv>().
  ...
}
```

The `Hono<ApiEnv>` instance is the *only* place where the
generic appears. The rest of the code relies on inference
flowing from that one declaration.

## How to type the user and session shapes

The user and session types are derived from the better-auth
instance via the official `$Infer.Session` pattern, not
from the runtime return of `getSession`:

```ts
// packages/api/src/types/api-env.ts
import type { AuthInstance } from "@workspace/auth"

user: AuthInstance["$Infer"]["Session"]["user"] | null
session: AuthInstance["$Infer"]["Session"]["session"] | null
```

The shape flows from the auth config (`packages/auth/src/auth.ts`).
A change in the session schema propagates without a manual
edit here. See [docs/guides/better-auth/hono.md](../../../../guides/better-auth/hono.md)
for the full integration pattern.

## Consequences

- A PR that introduces a global `ContextVariableMap`
  augmentation is rejected. The author removes the
  augmentation and relies on the per-app `Variables` generic.
- A PR that hand-types `user` or `session` in a context
  variable map (instead of using `AuthInstance["$Infer"]`)
  is rejected. The author uses the inferred type.
- The `?? "unknown"` fallbacks in `error-handler.ts` and
  `rate-limit.ts` are kept. They reflect a real lifecycle:
  `api.onError` runs before `requestId()`. A `string` type
  for `c.var.requestId` at that point would be a lie, and
  per-app typing prevents the lie from spreading.

## What this rule allows

- `import type { ApiEnv } from "./types/api-env.js"` in any
  file that needs to type a `Context` parameter.
- `createMiddleware<ApiEnv>(...)` for custom middleware
  that is registered on the main app.
- A different `ApiEnv` (with a different `Variables` shape)
  in a different Hono app inside the monorepo, if the
  context demands it. Each app owns its own typing.

## What this rule forbids

- `declare module "hono" { interface ContextVariableMap { ... } }`
  for any purpose. This is the pattern we are explicitly
  rejecting.
- A `hono-augment.ts` or `hono-augment.d.ts` in any package.
  If you find one, delete it.
- Importing `auth` (the runtime instance) into a type-only
  file. Use `AuthInstance` (the type) instead, to avoid
  pulling the runtime into the type system.

## Where this rule came from

The earlier draft of `packages/api/src/types/api-env.ts`
shipped with a `hono-augment.d.ts` companion file that
declared the three variables globally. The Hono docs were
re-read; the global augmentation was identified as the
anti-pattern Hono explicitly discourages; the file was
removed. The `?? "unknown"` fallbacks that had been
required to paper over the lie are still required — but
now because the type is honest, not because the type lies.

## Related

- [docs/guides/better-auth/hono.md](../../../../guides/better-auth/hono.md) —
  the integration pattern this ADR codifies.
- [ADR-001: oRPC is load-bearing](./ADR-001-orpc-is-load-bearing.md) —
  the contract this env feeds into.
- [ADR-002: File organization by sub-domain](./ADR-002-file-organization.md) —
  the directory structure the typing lives in.
