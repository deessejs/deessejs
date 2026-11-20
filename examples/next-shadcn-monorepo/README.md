# DeesseJS Next.js shadcn monorepo example

This private example follows shadcn's official Next.js monorepo layout: `apps/web` is the Next.js host and `packages/ui` contains the shared shadcn-style components. It uses the repository's root pnpm workspace, dependency catalog, lockfile, and Turbo configuration. The UI workspace is named `@deesse-example/ui` because this monorepo already owns `@workspace/ui`.

The web app consumes the local `deesse` and `@deessejs/drizzle-adapter` workspaces. Its Hono runtime is mounted through `deesse/next` at the Next.js API catch-all. The browser uses the zero-argument `createClient()` from `deesse/react` for oRPC calls and Better Auth. The React client bridge is explicit in `apps/web/src/lib/deesse-react.types.d.ts`, as required by Deesse's current type contract.

This is a small integration example, not a production starter. It demonstrates Better Auth email/password, a public health route, authenticated request context, and creating/listing posts through the plugin API. The postgres-js pool, generated schema, and migration files belong to this example. No product database package or migration is used.

## Requirements

- Node.js 24
- pnpm 11
- A PostgreSQL database the example can create tables in

## Setup

From the repository root:

```sh
pnpm install
cp examples/next-shadcn-monorepo/apps/web/.env.example examples/next-shadcn-monorepo/apps/web/.env
pnpm turbo build --filter=@deesse-example/web^...
pnpm --filter @deesse-example/web schema:generate
pnpm --filter @deesse-example/web db:generate
```

Review the SQL under `examples/next-shadcn-monorepo/apps/web/drizzle/`, then apply it explicitly:

```sh
pnpm --filter @deesse-example/web db:migrate
pnpm --filter @deesse-example/web dev
```

Open `http://localhost:3000`. Use the form to create an account, sign in, check the authenticated API route, load posts, and add a post. The example never applies migrations during server startup.

## Environment

Set these values in `apps/web/.env`:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string for the example database |
| `BETTER_AUTH_SECRET` | Secret of at least 32 characters for local auth sessions |
| `BETTER_AUTH_URL` | Auth base URL, normally `http://localhost:3000` |

The code has local-only fallback values so workspace typecheck and build do not need a live database. Supply real values to exercise requests. Do not deploy this example with the fallback secret or without a separately reviewed migration and database.

## Schema workflow

`auth.config.ts` is the Better Auth CLI source for the example's base auth schema. `deesse.config.ts` is the source for the plugin-owned posts schema and router. `schema:generate` writes tool-owned files under `apps/web/src/server/schema/`; do not edit those generated files. Drizzle Kit reads the schema barrel and creates migrations under this example's `drizzle/` directory. Review and commit migrations before applying them to a shared database.

The adapter integration tests use a separate fixture database. These example scripts do not change the adapter fixtures, `packages/database`, or the product migration workflow.

## Validation boundary

The repository CI build and typecheck include this workspace. The checked-in example does not provision PostgreSQL, apply migrations, or run end-to-end browser tests. To verify data persistence locally, use the setup workflow above and exercise the UI against the dedicated example database.
