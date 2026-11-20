# DeesseJS Next.js shadcn monorepo example

This private example follows shadcn's official Next.js monorepo layout: `apps/web` is the Next.js host and `packages/ui` contains the shared shadcn-style components. It uses the repository's root pnpm workspace, dependency catalog, lockfile, and Turbo configuration. The UI workspace is named `@deesse-example/ui` because this monorepo already owns `@workspace/ui`.

The web app consumes the local `deesse` and `@deessejs/drizzle-adapter` workspaces. Its Hono runtime is mounted through `deesse/next` at the Next.js API catch-all. The browser uses the zero-argument `createClient()` from `deesse/react` for oRPC calls and Better Auth. The router type is bound through a type-only module augmentation in `apps/web/deesse.config.ts`.

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

`deesse.config.ts` owns the declarative Better Auth settings, app router, postgres-js connection, Drizzle client, and adapter construction. It creates the runtime through `createDeesseApp()`, which loads the generated schema only after the explicit schema-generation workflow has run. The posts plugin and its schema live in `apps/web/plugins/posts.ts`.

`schema:generate` asks the Deesse Drizzle tooling to emit the plugin schema and a temporary Better Auth CLI configuration under the ignored `apps/web/.deesse/` directory. That internal configuration lets Better Auth's official CLI generate the auth schema from the same app settings and plugin contributions without requiring the example to construct or export a Better Auth instance. Drizzle Kit reads the generated schema files directly and creates reviewed migrations under this example's `drizzle/` directory. Do not edit generated output. Review and commit migrations before applying them to a shared database.

The adapter integration tests use a separate fixture database. These example scripts do not change the adapter fixtures, `packages/database`, or the product migration workflow.

## Validation boundary

The repository CI build and typecheck include this workspace. The checked-in example does not provision PostgreSQL, apply migrations, or run end-to-end browser tests. To verify data persistence locally, use the setup workflow above and exercise the UI against the dedicated example database.
