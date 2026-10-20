<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# apps/app

You own the authenticated product: the dashboard, the account settings, the administration area and every screen behind the login. This is the surface a signed-in user touches, so a change here is a change to the product itself.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace: the API path, the auth base path, the wire contracts, the research protocol and the git workflow. Read it when your change touches one of them, not before every edit.

## Key files

| File | Owns |
|---|---|
| `proxy.ts` | The request guard. Protected prefixes, auth prefixes, the session lookup and the email-verification check. |
| `lib/settings-paths.ts` | The account settings routes and `SETTINGS_PREFIX`, the constant the proxy imports. |
| `lib/auth-client.ts` | The browser-side Better Auth client and the plugins it enables. |
| `lib/fetch-auth-interceptor.ts` | Attaches the session to the outgoing calls. |
| `lib/orpc.ts` | The typed oRPC client pointed at the API base path. |
| `lib/admin-auth.ts` | The `role` check behind the `/admin` area. |
| `app/api/[[...route]]/route.ts` | The catch-all that exposes the API under the active base path. |
| `components/` | The auth forms, the settings panels, the sidebars, the providers. |

## Routes

Two route groups, and the difference matters:

- `(protected)` holds `/home`, `/account/settings` and `/admin`.
- `(unprotected)` holds the auth screens: login, signup, forgot password, reset password, verify email, and `/device`.

`/device` is the approval view used by the CLI device flow. It is deliberately absent from the auth prefixes in the proxy, so an authenticated user landing there from the CLI sees the approve and deny actions instead of being bounced to `/home`.

## Invariants

- **The guard is `proxy.ts`, not `middleware.ts`.** Next.js 16 renamed it, and a proxy file cannot declare a route segment runtime.
- **The proxy never imports Better Auth.** It resolves the session over HTTP through `API_AUTH_PATH/get-session`, using `API_AUTH_PATH` from `@workspace/api/base-path` so the route follows the server mount. The current value is `/api/v1/auth`. This avoids loading the Drizzle adapter and `postgres` into the Next.js proxy bundle.
- **The settings paths live in `settings-paths.ts`,** never in the proxy matcher. The proxy imports `SETTINGS_PREFIX` from there.
- **The proxy reads the session on every request,** with `cache: "no-store"`. A cached session turns the gate into a stale decision.
- **The session payload shape is `{ session, user }` at the top level.** An earlier revision assumed `session.user`, which silently disabled the email-verification check on every protected route because the property was always undefined.
- **App code talks to auth and data through clients.** Browser auth uses `lib/auth-client.ts`; app data uses `lib/orpc.ts` and `@workspace/api`. Never import runtime `auth` from `@workspace/auth` or `db` / tables from `@workspace/database` in an application. A server component that needs auth state must call the HTTP endpoint through an app-owned server client and forward the request headers. Put client-safe shared types in `@workspace/contracts`; direct type-only service imports require a concrete reason and must not import runtime code.
- The current direct `auth.api.getSession()` call in the device page and the session-token helpers imported from `@workspace/auth/types` are migration targets. Do not copy those patterns.

## Commands

```bash
pnpm dev                    # next dev, port 3000
pnpm test                   # vitest
pnpm test:run               # vitest run
pnpm typecheck
pnpm lint
```

The tests live in `tests/`: `proxy.test.ts` covers the guard, `settings-paths.test.ts` covers the route constants.

## Conventions

- Server components by default. `"use client"` only where interaction demands it.
- Forms use `react-hook-form` and Zod. The schemas sit next to the form, in `components/auth/schemas.ts` and the settings panels.
- The design system comes from `@workspace/ui`. Reference semantic tokens, never raw colors.
- Redirect targets that come from a query parameter or an OAuth callback go through `safeRedirect` from `@workspace/utils`.

## Related guides

- [Root guide](../../AGENTS.md)
- [packages/auth](../../packages/auth/AGENTS.md)
- [packages/api](../../packages/api/AGENTS.md)
- [packages/ui](../../packages/ui/AGENTS.md)
- [packages/utils](../../packages/utils/AGENTS.md)
