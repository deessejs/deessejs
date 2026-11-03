# `@workspace/auth`

The authentication layer of DeesseJS: one Better Auth instance, five plugins, and the rules that decide who may do what.

## What's included

- **`auth`**: the configured Better Auth instance, the single source of truth for authentication
- **Five plugins**: device authorization, bearer, admin, organization, and the Next.js cookie integration
- **`isHostAllowed`**: the host allowlist, shared with the CORS layer of the API
- **The organization policy**: the name and slug validation, and the reserved slug set
- **The invitation delivery**: delegated to `@workspace/email`
- **Branded session types**: `SessionId` and `SessionToken`, so the two are not interchangeable at compile time

## The plugins

| Plugin | What it adds |
|---|---|
| `deviceAuthorization` | The device code flow the CLI uses to log in a machine |
| `bearer` | Session resolution from an `Authorization: Bearer` header, for a stateless client |
| `admin` | The `role`, `banned`, `banReason` and `banExpires` columns, and the `/admin` gate |
| `organization` | Organizations, members and invitations, configured in `src/organization/plugin.ts` |
| `nextCookies` | The Next.js cookie integration, always last in the list |

## Usage

Serve the handler from the API:

```ts
import { auth } from "@workspace/auth"

api.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw))
```

Resolve a session inside server-side code in `packages/api`:

```ts
import { auth } from "@workspace/auth"

const session = await auth.api.getSession({ headers })
```

Application workspaces must not import the runtime `auth` instance or call `auth.api.*`; use the app-owned auth client or an HTTP request to the endpoint exposed by `packages/api`. This server example is for the server boundary, not application code.

Build the browser client in the application. The base path must match the Hono mount; use the shared constant instead of Better Auth's default path:

```ts
import { createAuthClient } from "better-auth/react"
import { API_AUTH_PATH } from "@workspace/api/base-path"
import { getAuthBaseUrl } from "@/lib/auth-base-url"

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
  basePath: API_AUTH_PATH,
})
```

The authenticated app resolves this URL to `window.location.origin` in the browser, so auth requests stay on the active deployment origin. See `apps/app/lib/auth-client.ts` for the complete configured client and plugins.

## Exports

| Export | Import path | Contents |
|---|---|---|
| `.` | `@workspace/auth` | The `auth` instance, and the `User`, `Session` and `AuthSession` types |
| `./host-allowlist` | `@workspace/auth/host-allowlist` | `HOST_ALLOWLIST`, `isHostAllowed()` |
| `./organization/policy` | `@workspace/auth/organization/policy` | The name and slug validation |
| `./organization/invitation` | `@workspace/auth/organization/invitation` | The invitation delivery |
| `./types` | `@workspace/auth/types` | The branded session identifiers |

## Commands

```bash
pnpm auth:generate   # regenerate the Drizzle schema in packages/database
pnpm test            # email flows, providers, session, organization
pnpm test:run
pnpm test:coverage
pnpm build
pnpm typecheck
pnpm lint
```

## Notes

- The base path is `/api/v1/auth`, and it has to match the mount of `@workspace/api`. The value is duplicated on purpose, because the API depends on this package and importing it back would create a cycle. Change both sides together.
- The email callbacks never throw. They dispatch the mail and report a failure through `logEmailFailure`, so a mail transport outage never breaks the request that triggered it.
- A synthetic sign-up response carries the admin fields, so the presence of `role` on a response does not become an account-enumeration signal.
- The schema in `packages/database/src/schema/auth.ts` is generated. Never edit it by hand.

## Related

- **Uses**: [`@workspace/database`](../database/README.md), [`@workspace/email`](../email/README.md), [`@workspace/env`](../env/README.md)
- **Used by**: [`@workspace/api`](../api/README.md), [`apps/app`](../../apps/app/README.md)

The conventions of this package are in [AGENTS.md](AGENTS.md).
