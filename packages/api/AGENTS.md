# packages/api

You own the server: the Hono application, the oRPC router, the registry endpoint and the mount point where Better Auth is served. A request enters here and leaves as a typed response.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace: the API path, the auth base path, the wire contracts, the research protocol and the git workflow. Read it when your change touches one of them, not before every edit.

## Key files

| Path | Owns |
|---|---|
| `src/index.ts` | The Hono app, the middleware chain and the mounts. |
| `src/constants/base-path.ts` | The API path. The single source of truth. |
| `src/http/routes/http.ts` | The plain HTTP routes, including the Better Auth mount. |
| `src/http/middleware/` | request id, secure headers, session, rate limit, etag, bucket, error handler. |
| `src/http/mount-rpc.ts` | The oRPC mount. |
| `src/orpc/routes/` | The typed procedures: the templates route and the app router. |
| `src/core/templates/` | The GitHub client and the enrichment of the registry rows. |
| `src/templates.ts` | The registry rows themselves. |
| `src/http/env.ts` | The typed environment of the Hono context. |

## The paths

| Constant | Value | Serves |
|---|---|---|
| `API_BASE_PATH` | `/api/v1` | The prefix of the whole API. |
| `API_RPC_PATH` | `/api/v1/rpc` | The oRPC procedures endpoint. |
| `API_AUTH_PATH` | `/api/v1/auth` | The Better Auth handler. |
| `API_HEALTH_PATH` | `/api/v1/health` | The liveness route. |
| `API_READY_PATH` | `/api/v1/ready` | The readiness route, which fails with 503 when the database is unreachable. |

The Hono routes are written relative to the base path, so `/health` in the code becomes `/api/v1/health` on the wire. The oRPC client targets `API_RPC_PATH`.

**Never hardcode `/api/v1` in an app or a package.** Import the constant. When a V2 is introduced, define `API_BASE_PATH_V2`, point `API_BASE_PATH` at it, and keep V1 served as a deprecated alias for the CLI clients already installed in the wild.

## Invariants

- **This is the server-side composition boundary for applications.** It mounts auth endpoints and exposes typed API procedures. Applications call those through clients; they never import runtime auth or database implementations. The API and auth packages may import those implementations on the server, with `packages/auth` using the database for its adapter.
- **All email delivery goes through `packages/email`.** If an API feature needs to send email, call the email package's supported interface. Do not add a Resend/provider client, transport or message template here. The API and auth may adapt their own domain events, but their adapters are not interchangeable; `packages/email` owns delivery and templates. See [packages/email](../email/AGENTS.md).
- **The Better Auth mount is `/auth/*`,** relative to the base path, and it has to stay aligned with `AUTH_BASE_PATH` in `packages/auth`. See [packages/auth](../auth/AGENTS.md).
- **The CORS allowlist echoes the origin only when the host is permitted.** The credentials mode forbids the wildcard `Access-Control-Allow-Origin`, so the origin function returns the origin or `null`, never `*`.
- **The registry rows are static, the registry data is live.** `src/templates.ts` holds the curated rows, `src/core/templates/enrich.ts` fetches the license, the stars, the README and the last push from GitHub at request time. A row without a matching public repository makes the endpoint fail loudly with a 503.

## Conventions

- Relative imports carry the `.js` extension, and the package is ESM.
- The exports map is the public surface: `.`, `./router`, `./base-path` and `./templates-labels`. A new subpath has to be added there.
- The typed context lives in `src/http/env.ts`. A middleware that stores something in the context declares it there first.

## Commands

```bash
pnpm build         # tsc
pnpm test          # vitest
pnpm test:run
pnpm test:coverage
pnpm typecheck
pnpm lint
```

The tests live in `tests/`: `unit/`, `integration/` and `contract/`.

## Related guides

- [Root guide](../../AGENTS.md)
- [packages/auth](../auth/AGENTS.md)
- [packages/contracts](../contracts/AGENTS.md)
- [packages/database](../database/AGENTS.md)
- [apps/app](../../apps/app/AGENTS.md)
