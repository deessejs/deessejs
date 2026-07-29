# `packages/api`

The API package. Framework-agnostic core + Hono as host + oRPC for both transports. The single source of truth for everything the web app calls internally (`/rpc/*`) and what external consumers hit (`/api/v1/*`).

## Purpose

Wrap business logic in two interchangeable transports, both served from one Hono app:

- **oRPC RPCHandler** at `/rpc/*` — type-safe internal calls from `apps/web`
- **oRPC OpenAPIHandler** at `/api/v1/*` — public REST with OpenAPI spec generation, consumed by the SDK, the CLI, and third-party integrations

The core is framework-agnostic. Hono is the host. oRPC provides both transports. Better Auth mounts separately at `/api/auth/*`.

## Surface

Public exports from `packages/api/src/index.ts`:

| Export | Purpose |
|---|---|
| `app` | The Hono app. Mounted by `apps/web` at the root of the API surface. |
| `router` | The oRPC router. Used for OpenAPI spec generation and for the type-safe client (`@orpc/client`). |
| `base` | The oRPC base builder (`os.$context<ApiBaseContext>()`). Composed into `authorized` and `publicProcedure`. |
| `authorized` | `base.use(authMiddleware)` — use for protected procedures that require a session. |
| `publicProcedure` | `base` without auth — use for sign-up, sign-in, health probes, and HMAC-authenticated webhooks. |
| `authContextMiddleware` | The **Hono** middleware that creates the per-request `db`, `requestId`, and `log`, and resolves the session (single `getSession` call per request). Composed in `app.ts`. |
| `authMiddleware` | The **oRPC** middleware that validates the session in the oRPC context and throws `ORPCError('UNAUTHORIZED')` if missing. Composed in `authorized.ts`. |
| `errors` | The error taxonomy (`UnauthenticatedError`, `ForbiddenError`, etc.) — thin re-export of the oRPC `ORPCError` codes plus our domain extensions. |

## Internal structure

```
packages/api/
├── src/
│   ├── core/                # framework-agnostic procedures (the leverage layer)
│   ├── orpc/                # RPCHandler + client types
│   ├── hono/                # OpenAPIHandler + spec generation + Scalar UI
│   ├── middleware/          # cross-cutting (auth, rate-limit, request-id, logging, CORS)
│   ├── errors/              # error taxonomy + onError interceptor
│   ├── registry.ts          # FeatureApi aggregation (the modular contract)
│   ├── app.ts               # Hono app composition
│   ├── router.ts            # oRPC router composition
│   └── index.ts             # public surface
├── tests/                   # vitest unit + integration + OpenAPI contract + delete tests
├── package.json
└── tsconfig.json
```

See [`structure.md`](./structure.md) for the file-by-file contract.

## Conventions

- **No feature imports in `core/`, `middleware/`, or `middlewares/`.** Enforced by ESLint `no-restricted-imports`. The modular contract (see [`../05-modular-contract/`](../05-modular-contract/)) requires that features are self-contained.
- **No `db.select()` direct calls.** All DB access goes through data-access functions from `@deessejs/database/<feature>`. Each function takes `(db, orgId, ...args)` explicitly. Cross-tenant data access is a top-3 security risk.
- **No direct logger singletons.** Features receive `ctx.log` from the request context. The logger is swappable and pre-enriched with `requestId` and `orgId`.
- **One Zod schema per procedure, in `core/<feature>/schemas.ts`.** Same schema validates input, generates the TS type, and feeds OpenAPI generation.
- **Procedures are pure.** `core/<feature>/procedures.ts` exports `os.*` builders. No transport concerns leak in.
- **Two handlers, one router.** Both `/rpc/*` and `/api/v1/*` mount the same router. Internal procedures are tagged `internal` and filtered out of the public OpenAPI handler via `OpenAPIHandler({ filter: ... })`.
- **Errors via `ORPCError`.** Procedures throw `new ORPCError(code, { message, data })`. oRPC maps codes to HTTP statuses automatically; the `onError` interceptor reshapes them to our canonical wire format `{ code, message, details?, requestId }`. See [`errors/on-error.ts`](./structure.md#srcerrors).
- **Use `authorized` for protected procedures, `publicProcedure` for the rest.** The choice is at the type level — a `publicProcedure` handler cannot accidentally read `context.session`.

## Testing

- **Unit (Vitest)** — pure functions in `core/`. 80% line / 75% branch coverage.
- **Integration (Vitest + real Postgres + real Redis)** — `core/` end-to-end with the DB and cache. Transactional rollback per test.
- **Contract (OpenAPI snapshot)** — every PR diffs the generated OpenAPI spec against the committed one. Breaks the build on undeclared changes.
- **Delete tests (per feature)** — removing `src/features/<feature>/` must not leave dangling imports. The registry pattern makes this mechanical.
- **No real server.** Tests call `app.request(req)` directly — Hono accepts Fetch API `Request` and returns `Response`. No supertest, no listen socket, no port collisions.

Full system strategy: [`../08-testing/`](../08-testing/).

## Cross-references

### System concerns

- [`../04-api-surface/`](../04-api-surface/) — the public surface this package exposes
- [`../05-modular-contract/`](../05-modular-contract/) — the registry pattern is the API-side enforcement
- [`../06-security/`](../06-security/) — auth, tenant isolation, rate limiting
- [`../08-testing/`](../08-testing/) — test strategy

### System ADRs

- [`../10-decisions/0011-repo-structure.md`](../10-decisions/0011-repo-structure.md) — apps/packages contract (superseded)
- [`../10-decisions/0012-template-as-pattern.md`](../10-decisions/0012-template-as-pattern.md) — current repo structure

### Related packages

- [`../database/`](../database/) — `packages/database` (Drizzle ORM, schema, data-access functions). All DB access goes through this package's functions; procedures never import `drizzle-orm` directly.

### Local docs

- [`structure.md`](./structure.md) — file-by-file contract for the package
- [`hosting.md`](./hosting.md) — Next.js App Router mount, Vercel config, Fluid Compute implications, bundle size
- [`decisions/0001-node-runtime-not-edge.md`](./decisions/0001-node-runtime-not-edge.md) — the runtime choice (Node, not Edge)

### Local ADRs

Added in `decisions/NNNN-<slug>.md` as decisions are made. See [`../11-packages/README.md`](../README.md) for the ADR scope rule.
