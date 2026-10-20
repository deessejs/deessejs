# `@workspace/api`

The DeesseJS server: a Hono application that serves the template registry, the typed oRPC procedures and the Better Auth handler.

## What's included

- **`api`**: the Hono app, mounted in the applications at `/api/v1`
- **`appRouter`**: the oRPC router, served at `/api/v1/rpc`
- **The Better Auth handler**: mounted at `/api/v1/auth`
- **The registry**: the curated template rows, enriched at request time with the live GitHub data
- **The middleware chain**: request id, secure headers, CORS, logging, session, rate limit, ETag, error handler

## The paths

| Constant | Value | Serves |
|---|---|---|
| `API_BASE_PATH` | `/api/v1` | The prefix of the whole API |
| `API_RPC_PATH` | `/api/v1/rpc` | The oRPC procedures endpoint |
| `API_AUTH_PATH` | `/api/v1/auth` | The Better Auth handler |
| `API_HEALTH_PATH` | `/api/v1/health` | Liveness |
| `API_READY_PATH` | `/api/v1/ready` | Readiness, 503 when the database is unreachable |

All of them live in `src/constants/base-path.ts`, which is the single source of truth. The Hono routes are written relative to the base path, so `/health` in the code is `/api/v1/health` on the wire.

## Usage

Mount the app in a Next.js catch-all route:

```ts
import { handle } from "hono/vercel"
import { api } from "@workspace/api"

export const dynamic = "force-dynamic"

export const GET = handle(api)
export const POST = handle(api)
```

Call a procedure with the typed client:

```ts
import { orpc } from "@/lib/orpc"

const { templates } = await orpc.templates.list()
```

## Exports

| Export | Import path | Contents |
|---|---|---|
| `.` | `@workspace/api` | The `api` app, the `appRouter`, the path constants |
| `./router` | `@workspace/api/router` | The oRPC router, used to build a typed client |
| `./base-path` | `@workspace/api/base-path` | The path constants |
| `./templates-labels` | `@workspace/api/templates-labels` | The human labels of the registry axes |

## Commands

```bash
pnpm build
pnpm test          # unit, integration and contract suites
pnpm test:run
pnpm test:coverage
pnpm typecheck
pnpm lint
```

## Notes

- This is the server-side composition boundary for applications. App code calls its typed procedures through clients; it does not import runtime authentication or database implementations directly. The API mounts auth endpoints and coordinates database-backed operations.
- The registry rows are static, the registry data is live: the license, the stars, the README and the last push come from GitHub at request time. A row without a matching public repository makes the endpoint fail loudly with a 503.
- The Better Auth mount has to stay aligned with `AUTH_BASE_PATH` in `@workspace/auth`. A mismatch makes every auth URL return 404 in production.
- If an API feature needs to send email, delegate delivery and templates to [`@workspace/email`](../email/README.md). Do not add a provider client or template to the API; the API guide describes the ownership boundary.

## Related

- **Uses**: [`@workspace/auth`](../auth/README.md), [`@workspace/contracts`](../contracts/README.md), [`@workspace/database`](../database/README.md), [`@workspace/env`](../env/README.md)
- **Used by**: [`apps/app`](../../apps/app/README.md), [`apps/cli`](../../apps/cli/README.md), [`apps/web`](../../apps/web/README.md)

The conventions of this package are in [AGENTS.md](AGENTS.md).
