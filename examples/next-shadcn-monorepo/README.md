# DeesseJS Next.js shadcn monorepo example

This private example follows shadcn's official Next.js monorepo layout: `apps/web` is the Next.js host and `packages/ui` contains the shared shadcn-style components. It uses the repository's root pnpm workspace, dependency catalog, lockfile, and Turbo configuration. The UI workspace is named `@deesse-example/ui` because this monorepo already owns `@workspace/ui`.

The web app consumes the local `deesse` and `@deessejs/drizzle-adapter` workspaces. Its Hono runtime is mounted through `deesse/next` at the Next.js API catch-all. The app's `tsconfig.json` maps `@deesse-config` to its root `deesse.config.ts`. The route imports the runtime config through that alias, and `src/lib/deesse-client.ts` imports the server instance from the same alias as a type. It creates the clients in one call: `createClient({ server: deesseServer<typeof deesse>() })`. `DeesseServer<typeof deesse>` exposes only the composed oRPC router type. The `server` witness is a separate option from Better Auth's nested `auth` options and creates no runtime import of the server config. The example has no additional auth fields, so it uses Better Auth's built-in client types without `inferAdditionalFields`. Apps can pass Better Auth client plugins under `auth.plugins`; custom auth endpoints use Better Auth's documented client-plugin pairing. No generated declarations or global augmentation are used.

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

`deesse.config.ts` owns the declarative Better Auth settings, app router, postgres-js connection, Drizzle client, adapter construction, and the synchronous `createDeesse()` call. Deesse constructs Better Auth internally. Root plugin registrations are collected in `apps/web/plugins/index.ts`; the posts plugin and its schema live in `apps/web/plugins/posts.ts`.

`schema:generate` writes two generated Drizzle table modules into the visible project schema area: `src/server/database/schema/deesse.ts` and `src/server/database/schema/auth.ts`. The Deesse schema CLI reads the root plugin registry in `plugins/index.ts` and emits plugin tables without connecting to PostgreSQL. The Better Auth CLI reads an internal config bridge under `.deesse/tooling/`; the bridge imports the framework-owned `deesse` config and reuses `deesse.auth`, so the app never constructs Better Auth. Better Auth's CLI remains the source of the auth table definitions.

`deesse.config.ts` imports both visible schema modules and passes their combined exports to the app-owned Drizzle client. `drizzle.config.ts` points Drizzle Kit at those same files. The adapter needs the runtime table objects to build its model lookup and verify plugin model declarations against the configured tables. These are database schema artifacts, not generated TypeScript client declarations. On a clean checkout, the generation scripts create the schema files before typecheck or build. Do not hand-edit generated output. Use Drizzle Kit to generate SQL migrations under `drizzle/`, review and commit those migrations, then apply them explicitly with `db:migrate`. Server startup performs no DDL.

The adapter integration tests use a separate fixture database. These example scripts do not change the adapter fixtures, `packages/database`, or the product migration workflow.

## Validation boundary

The repository CI build and typecheck include this workspace. The checked-in example does not provision PostgreSQL, apply migrations, or run end-to-end browser tests. To verify data persistence locally, use the setup workflow above and exercise the UI against the dedicated example database.
