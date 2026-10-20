# packages/database

You own the schema: the Drizzle tables, the migrations and the database client. Everything that persists in this product passes through here.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace: the API path, the auth base path, the wire contracts, the research protocol and the git workflow. Read it when your change touches one of them, not before every edit.

## Service boundary

This is server-side persistence infrastructure. Application workspaces must not import `db`, Drizzle tables or database helpers to perform product operations. Expose those operations through typed API procedures and clients. `packages/api` and `packages/auth` may use this package inside the server boundary. New stateful infrastructure, including cache, follows the same client boundary for applications.

## Key files

| Path | Owns |
|---|---|
| `src/schema/auth.ts` | The generated authentication schema. Owned by the Better Auth CLI. |
| `src/schema/index.ts` | The schema barrel, passed to the Drizzle adapter as a whole. |
| `src/tables/index.ts` | Where the application tables go. |
| `src/client.ts` | The `db` instance and the connection string. |
| `src/test-utils.ts` | The helpers the tests use. |
| `drizzle/` | The generated SQL migrations. |
| `drizzle.config.ts` | The Drizzle Kit configuration. |
| `tests/setup.ts` | The pg-mem setup. |

## Invariants

- **`src/schema/auth.ts` is generated.** `pnpm auth:generate` rewrites it from the Better Auth configuration in `packages/auth`. A hand edit disappears at the next generation. If a field is missing, change the plugin configuration and regenerate.
- **The application tables live in `src/tables/`,** not in the auth schema. The barrel in `src/tables/index.ts` is where a new table is exported.
- **The schema barrel is passed whole to the adapter.** `packages/auth` imports `* as schema from "@workspace/database"`, so a table that is not exported from the barrel does not exist for the adapter.
- **The migrations are generated, never written by hand.** `pnpm db:generate` diffs the schema against the last migration and writes the SQL. `pnpm db:push` syncs the schema directly and is a development-only shortcut.
- **The baseline is a single migration** in `drizzle/`. The schema generation was made reproducible so the baseline stays valid.

## Testing

The suite runs on **pg-mem**, an in-memory Postgres. It needs no database instance, which is why `pnpm test` works on a clean checkout.

That comes with a rule: a query that pg-mem does not implement will fail in the test suite even though it works in production. When a test fails on a SQL feature, check whether the feature is supported before changing the query.

## Commands

```bash
pnpm db:generate   # diff the schema, write a SQL migration
pnpm db:migrate    # apply the pending migrations
pnpm db:push       # sync the schema directly, development only
pnpm db:studio     # open Drizzle Studio
pnpm db:check      # drizzle-kit check
pnpm test
pnpm test:run
pnpm test:coverage
pnpm typecheck
pnpm lint
```

## Migration safety

The migration SQL is linted by Squawk, configured in `.squawk.toml` at the root. The rules catch the destructive patterns: dropping a column that still holds data, adding a `NOT NULL` column without a default, and the unsafe type changes.

A rule can be waived with a `squawk-ignore` directive placed next to the statement it applies to, and with a comment saying why. The directive belongs in the migration file, next to the statement, not in the config file.

## Related guides

- [Root guide](../../AGENTS.md)
- [packages/auth](../auth/AGENTS.md)
- [packages/api](../api/AGENTS.md)
- [packages/env](../env/AGENTS.md)
