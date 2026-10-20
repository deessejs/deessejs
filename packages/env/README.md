# `@workspace/env`

The environment contract of DeesseJS: which variables exist, what they must look like, and which code may read them.

## What's included

- **`serverEnv`**: the validated server environment, eager and lazy in the right places
- **`clientEnv`**: the validated client environment, the `NEXT_PUBLIC_*` values only
- **The URL helpers**: `webURL()`, `appURL()`, `docsURL()` and `apiBaseURL()`
- **The loader**: the snapshot of the environment files, mirrored into `process.env`

## Usage

Read a server variable:

```ts
import { serverEnv } from "@workspace/env/server"

const url = serverEnv.DATABASE_URL
```

Read a client variable, or build an inter-app URL:

```ts
import { clientEnv, appURL } from "@workspace/env/client"

const link = new URL("/account/settings", appURL())
```

## Exports

| Export | Import path | Contents |
|---|---|---|
| `.` | `@workspace/env` | Both environments, for a single import |
| `./server` | `@workspace/env/server` | `serverEnv`, `getServerEnv` |
| `./client` | `@workspace/env/client` | `clientEnv` and the URL helpers |
| `./schema` | `@workspace/env/schema` | The raw schemas and the `ServerEnv`, `ClientEnv` types |

Prefer the explicit subpaths. The root export pulls both halves in, which defeats the tree shaking.

## The variables

| Variable | Rule |
|---|---|
| `DATABASE_URL` | Required in production |
| `TEST_DATABASE_URL` | Historical alias for `DATABASE_URL` |
| `BETTER_AUTH_SECRET` | At least 32 characters in production |
| `AUTH_SECRET` | Historical alias for `BETTER_AUTH_SECRET` |
| `BETTER_AUTH_URL` | Defaults to `http://localhost:3000` |
| `ALLOWED_ORIGINS` | A comma-separated list |
| `MAIL_TRANSPORT` | `console` (default) or `resend` |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME` | Required when the transport is `resend` |
| `RATE_LIMIT_PER_MINUTE` | A positive integer, 100 by default |
| `GITHUB_TOKEN` | Optional. Without it, the registry enrichment hits GitHub anonymously |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Optional. The GitHub sign-in stays hidden without them |
| `PARENT_DOMAIN` | Required in production, for the cross-subdomain cookies |

The client variables are `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_DESCRIPTION`, `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DOCS_URL` and `NEXT_PUBLIC_API_BASE_URL`.

## Commands

```bash
pnpm build
pnpm typecheck
pnpm test
```

From the root, `pnpm env:check` validates that the required variables are present, with the same alias convention.

## Notes

- Each role maps to exactly one variable: `webURL()` is the marketing origin, `appURL()` the authenticated product origin, `docsURL()` the documentation origin, `apiBaseURL()` the API origin. Aliasing one role to another variable is forbidden.
- Compose with `new URL(path, base)` rather than by concatenating strings, and never hardcode a trailing slash: the schema rejects it at parse time.
- The client entry never imports the loader. The loader reads `node:fs`, which Turbopack cannot bundle into a client chunk.
- Validation fires at module load. A missing required variable stops the process instead of failing later at the first use.

The conventions of this package are in [AGENTS.md](AGENTS.md).
