# `packages/auth`

The auth package. Owns the configured Better Auth instance, the Hono-mountable auth handler, and the bridge to the rest of the system. The actual session / organization / API-key tables live in `packages/database` (Drizzle schema), but this package is the **runtime** that consumes them.

> **Version note.** Built on `better-auth@1.6.19` (the latest stable as of 2026-06-16). See [`decisions/0001-security-baseline-1.6.19.md`](./decisions/0001-security-baseline-1.6.19.md) for the security baseline (we pin `>= 1.6.14` minimum) and the bump procedure. See [`security-baseline.md`](./security-baseline.md) for the operational side.

## Purpose

Provide a single, configured Better Auth instance that:

- **Mounts on Hono** at `/api/auth/*` for the sign-in / sign-up / OAuth / magic link / 2FA / passkey / API key endpoints.
- **Verifies sessions** for `apps/web` via cookie.
- **Verifies API keys** for the public REST at `/api/v1/*` (the bridge that makes the oRPC Hono handler auth-aware).
- **Provides the org + RBAC + admin** building blocks the spec corpus demands (spec 2.1-2.20).
- **Generates the schema** consumed by `packages/database` (via `npx auth@latest generate`).

The package is thin by design. Almost all of the auth logic lives in the Better Auth library; our job is the **configuration**, the **schema ownership**, and the **bridge to our oRPC Hono app**.

## Surface

Public exports from `packages/auth/src/index.ts`:

| Export | Purpose |
|---|---|
| `auth` | The configured `BetterAuth` instance. |
| `auth.handler` | The Hono-mountable request handler. Mounted at `/api/auth/*` in `packages/api`. |
| `auth.api` | Server-side API. Used by `packages/api/middleware/auth-context.ts` to verify sessions and API keys. |
| `AccessControl` (instance) | The RBAC matrix from the org plugin. Exposed so the rest of the system can call `accessControl.statement(...)` consistently. |
| `STATEMENTS` (constant) | The named permission statements (e.g. `['project', 'create']`) used across the system. |
| `ROLES` (constant) | The named roles (owner, admin, member, billing) with their bundled statements. |

`packages/auth` does **not** import from `apps/*` or `packages/api`. The dependency direction is `apps → packages`, never the reverse.

## Internal structure

```
packages/auth/
├── src/
│   ├── auth.ts                  # createAuth() + the configured auth instance (all plugin calls live here)
│   ├── auth.test.ts             # test-only instance (PGlite + testUtils plugin) — not in production build
│   ├── access-control.ts        # createAccessControl(...) + statements + roles (for the org plugin)
│   ├── hooks/                   # databaseHooks + organizationHooks (custom logic at lifecycle points)
│   ├── utils/                   # small helpers (idempotency keys for sendMail hooks)
│   └── index.ts                 # public surface (auth, Auth, Session, User, ac, owner, admin, member, billing, STATEMENTS)
├── tests/
│   └── integration/             # vitest integration tests against auth.test.ts
├── package.json
└── tsconfig.json
```

> **Drift note.** Earlier revisions of this doc listed `plugins/{organization,admin,api-key,…}.ts` as separate files. In reality, every plugin call lives inline in `src/auth.ts` — there's no `plugins/` folder. The plugin-specific deep dives (rationale, options, gotchas) live as standalone docs in this folder: `plugins.md` (the index), `admin.md`, `impersonation.md`. If we ever split `auth.ts` into per-plugin files (recommended once it exceeds ~300 lines), update this section to match.

See [`setup.md`](./setup.md) for the `createAuth()` details, [`plugins.md`](./plugins.md) for the plugin-by-plugin rationale, [`admin.md`](./admin.md) for the admin plugin deep dive, and [`api-keys.md`](./api-keys.md) for the API key bridge.

## How `packages/api` consumes this package

```
oRPC procedure (packages/api/src/core/<feature>/procedures.ts)
  → reads context.repos.<table>     ← from packages/database
  → reads context.auth              ← from packages/auth (AuthContext)
  → calls repo method
  → returns response
```

The `AuthContext` is built by `packages/api/src/middleware/auth-context.ts` in two modes:

1. **Cookie session (for `/rpc/*`)** : `auth.api.getSession({ headers })` returns the session + user + active org.
2. **API key (for `/api/v1/*`)** : `auth.api.verifyApiKey({ body: { key } })` returns the key + the owning user/org.

Both modes produce the same `AuthContext` shape, so procedures don't care which transport they run on.

## The Drizzle schema that backs Better Auth

Better Auth's CLI (`npx auth@latest generate`) produces the Drizzle tables for `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`, `apikey`, and the secondary storage. These tables live in **`packages/database/src/schema/auth/`**, not in `packages/auth`.

Why split:
- `packages/database` is the single owner of the schema (modular contract).
- Other features (procedures, repos) need to reference `user` and `member` — they import from `packages/database`, not `packages/auth`.
- Generated schema is **committed, never auto-regenerated**. Bumps are manual PRs reviewed like any other migration.

The generated schema is also **enriched with our Drizzle relations** (RQBv2 `defineRelations(...)` in `packages/database/src/relations.ts`) so that `experimental.joins: true` in the Better Auth config works (2-3x perf on session fetches).

## Versions and dependencies

| Package | Version | Why |
|---|---|---|
| `better-auth` | `1.6.19` (pinned exact) | Security baseline. See ADR 0001. |
| `@better-auth/drizzle-adapter` | matches `better-auth` | Drizzle ORM v1 integration. Must be on the same major. |
| `@better-auth/api-key` | matches `better-auth` | API key plugin. |
| `@deessejs/database` | workspace:* | The Drizzle instance and the schema. |
| `drizzle-orm` | `1.0.0-rc.3` | Same as the rest of the system. See `database/decisions/0002-drizzle-v1-rc.md`. |
| `next` (peer for cookie helpers) | peer | Only if we use Next-specific cookie helpers; otherwise not needed. |

The auth client (`createAuthClient(...)`) lives in `apps/web`, not in `packages/auth`. The auth client is application-side; the auth server is the package.

## Cross-references

### System concerns

- [`../../01-stack/better-auth.md`](../../01-stack/better-auth.md) — the per-tech rationale (why Better Auth)
- [`../../04-api-surface/`](../../04-api-surface/) — the public surface (sign-in endpoints, API key auth)
- [`../../05-modular-contract/`](../../05-modular-contract/) — the schema ownership pattern
- [`../../06-security/`](../../06-security/) — security posture (session, auth events audit log)

### System ADRs

- [`../../10-decisions/`](../../10-decisions/) — system-wide ADRs

### Related packages

- [`../database/`](../database/) — `packages/database`. Owns the schema Better Auth reads and writes. The Drizzle instance comes from here.
- [`../api/`](../api/) — `packages/api`. Mounts `auth.handler` and uses `auth.api.*` to build the `AuthContext`.

### Local docs

- [`setup.md`](./setup.md) — the `createAuth()` configuration, the Drizzle adapter, the joins opt-in (note: `experimental.joins` and `secondaryStorage` are documented but not yet applied — see M0-deferred-work.md)
- [`integrations.md`](./integrations.md) — Hono mount, session middleware (with the `cookieCache` workaround), Drizzle schema assembly
- [`plugins.md`](./plugins.md) — every plugin enabled in v1, with rationale per spec
- [`admin.md`](./admin.md) — the **admin plugin deep dive** (endpoints, config, `user.role` vs `member.role` ambiguity, options, gotchas)
- [`impersonation.md`](./impersonation.md) — the **impersonation flow** (server + UI banner + security + testing)
- [`api-keys.md`](./api-keys.md) — the API key flow for `/api/v1/*`, including rate limiting and secondary storage
- [`security-baseline.md`](./security-baseline.md) — the security version policy, advisory subscription, bump procedure, tracked upstream issues
- [`decisions/0001-security-baseline-1.6.19.md`](./decisions/0001-security-baseline-1.6.19.md) — the ADR that pins 1.6.19
- [`decisions/0002-admin-plugin-config.md`](./decisions/0002-admin-plugin-config.md) — the ADR for `defaultRole: 'member'`, `adminRoles: ['admin']`, no `ac`/`roles`
- [`M0-deferred-work.md`](./M0-deferred-work.md) — **production-readiness gaps**: 3 documented-but-unimplemented fixes (`satisfies BetterAuthOptions`, `secondaryStorage` for rate limiting, `experimental.joins`). All three must ship before `/api/v1/*` is public.

## Conventions

- **The Drizzle schema for Better Auth tables lives in `packages/database/src/schema/auth/`.** Generated by `npx auth@latest generate`, committed, never auto-regenerated.
- **Plugins are imported from `better-auth/plugins` or scoped packages** (`@better-auth/api-key`). The list of enabled plugins is the source of truth for what auth features the system supports.
- **Hooks (`databaseHooks`, `organizationHooks`) are the integration point** for our custom logic (e.g. login notifications, audit log, RLS-aware cascades). Better Auth calls them at the right lifecycle points.
- **The RBAC matrix is defined once in `access-control.ts`** via `createAccessControl(...)`. Roles reference statements. The rest of the system imports `ROLES` and `STATEMENTS` from `packages/auth`.
- **No secrets in the package source.** The auth configuration references `process.env.*` for OAuth client IDs, API keys, etc. The `.env.example` ships with the placeholders; the buyer fills them in.
