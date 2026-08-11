# Better Auth + Hono

How better-auth is mounted in the Hono app. Mirrors
[better-auth.com/docs/integrations/hono](https://better-auth.com/docs/integrations/hono)
but pinned to the concrete files in this repo. The upstream
page is the source of truth when the lib changes; this guide
exists to show what we wired where.

## Mount the handler

`auth.handler` runs on every request under `/auth/*` and is
responsible for login, signup, session, etc. — i.e. the
better-auth HTTP surface.

```ts
// packages/api/src/router/routes/http.ts
api.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw))
```

The catch-all at `apps/app/app/api/[[...route]]/route.ts`
forwards `/api/v1/auth/*` to the Hono app, which dispatches
to the better-auth handler.

## CORS

CORS is configured at the Hono level, not the better-auth
level. better-auth expects cross-origin requests to be
authorized at the framework layer.

```ts
// packages/api/src/index.ts
api.use(
  "*",
  cors({ origin: serverEnv.ALLOWED_ORIGINS, credentials: true }),
)
```

`ALLOWED_ORIGINS` is validated at the env-package boundary.
CORS is registered **before** the auth routes, per the
better-auth timing requirement.

## Middleware: populate `c.var.user` and `c.var.session`

The session middleware runs once per request and populates
the typed context variables, so downstream middleware and
oRPC procedures can read them without re-issuing
`auth.api.getSession({ headers })`.

```ts
// packages/api/src/middleware/session.ts
export const session = (): MiddlewareHandler => async (c, next) => {
  const data = await auth.api.getSession({ headers: c.req.raw.headers })
  c.set("user", data?.user ?? null)
  c.set("session", data?.session ?? null)
  await next()
}
```

`user` and `session` are `null` (not `undefined`) when the
request is unauthenticated — predictable shape for consumers.

## Typing the Hono environment

We use the official better-auth pattern, derived from the
auth instance config:

```ts
// packages/api/src/types/api-env.ts
import type { AuthInstance } from "@workspace/auth"

export type ApiEnv = {
  Variables: {
    requestId: string
    user: AuthInstance["$Infer"]["Session"]["user"] | null
    session: AuthInstance["$Infer"]["Session"]["session"] | null
  }
}
```

`AuthInstance["$Infer"]["Session"]` is the type better-auth
derives from the auth config. A change in the session schema
flows through automatically — no manual edit here.

**Do not augment Hono's `ContextVariableMap` globally.** The
per-app `Variables` generic on `new Hono<ApiEnv>()` is enough.
Global augmentation is explicitly discouraged by the Hono
docs: it adds types to every context, even where the setting
middleware never ran, hiding runtime `undefined` behind a
typed contract. See [Hono Context API](https://hono.dev/docs/api/context).

The `?? "unknown"` fallbacks in `error-handler.ts` and
`rate-limit.ts` are honest — `api.onError` runs before
`requestId()` so `c.var.requestId` is genuinely `undefined`
at that point.

## Consuming the typed values in routes

```ts
// oRPC procedure
export const getProfile = base.handler(async ({ context }) => {
  return context.user
})
```

`context.user` is typed as `AuthInstance["$Infer"]["Session"]["user"] | null`.
A non-null assertion requires going through `authGuard` (see
`router/procedures/auth-middleware.ts`).

## Client-side configuration

The web app and the CLI build their oRPC client via
`<app>/src/lib/orpc.ts`. No special Hono-client setup is
needed: the typed client (`@orpc/client`) handles cookie
forwarding automatically because the auth session is a
better-auth cookie managed by `auth.handler`.

## Cross-domain cookies

By default, better-auth sets `SameSite=Lax`. For
cross-subdomain setups (e.g. `app.deessejs.com` calling
`api.deessejs.com`), set `crossSubDomainCookies.enabled` in
the auth config — see
[better-auth.com/docs/integrations/hono#cross-domain-cookies](https://better-auth.com/docs/integrations/hono#cross-domain-cookies).
This repo currently runs app and API on the same Vercel
project (the catch-all at `apps/app`), so cross-subdomain
cookies are not yet configured.

## What this guide is not

This guide is not an ADR. It documents how better-auth + Hono
work in the current version of the lib, and where each piece
lives in our repo. The **decisions** (which pattern we picked
and why) live in `docs/engineering/architecture/decisions/`.
When a future change conflicts with this guide, the guide
is wrong, not the code.
