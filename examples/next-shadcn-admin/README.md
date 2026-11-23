# DeesseJS Next.js shadcn admin example

This private example keeps the existing `next-shadcn-monorepo` example intact and adds the `@deessejs/admin` package to a separate Next.js App Router host. It uses the repository's root pnpm workspace, dependency catalog, lockfile, and Turbo configuration. The shared UI workspace is named `@deesse-admin-example/ui` to avoid a workspace name collision.

The app registers `admin()` beside the posts plugin in its single Deesse runtime. The posts plugin statically contributes a nested Posts page, while the admin plugin contributes the Overview root page. A single optional catch-all Server Component serves `/admin` and `/admin/posts`; `AdminPage` resolves both from the composed runtime registry, guards each route with the shared Better Auth session and `admin` role, and uses Next.js `notFound()` for unknown paths. The normal app shell still demonstrates sign-up, sign-in, and the typed posts API.

## Requirements

- Node.js 24
- pnpm 11
- PostgreSQL database the example can create tables in

## Setup

From the repository root:

```sh
pnpm install
cp examples/next-shadcn-admin/apps/web/.env.example examples/next-shadcn-admin/apps/web/.env
pnpm exec turbo build --filter=@deesse-admin-example/web^...
pnpm --filter @deesse-admin-example/web schema:generate
pnpm --filter @deesse-admin-example/web db:generate
```

Review the generated SQL under `examples/next-shadcn-admin/apps/web/drizzle/`, then apply it explicitly and start the app:

```sh
pnpm --filter @deesse-admin-example/web db:migrate
pnpm --filter @deesse-admin-example/web dev
```

Open `http://localhost:3000`, create a user, and visit `/admin`. A regular user sees an access-denied state. To test the dashboard, create an admin user with Better Auth's admin CLI using the generated config at `apps/web/.deesse/tooling/auth.config.ts`, then sign in through the app.

With the server running and the example database migrated, exercise the protected route and shared API with:

```sh
pnpm --filter @deesse-admin-example/web smoke
```

The smoke script checks anonymous redirects and authenticated non-admin denial on both the root and nested admin routes, plus the Better Auth session and authenticated Deesse posts API path. Package tests cover nested page rendering and the unknown-path `notFound()` response. No migration runs during server startup.

## Environment

Set these values in `apps/web/.env`:

| Variable             | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `DATABASE_URL`       | Connection string for the isolated example database |
| `BETTER_AUTH_SECRET` | Secret of at least 32 characters for local sessions |
| `BETTER_AUTH_URL`    | Auth base URL, normally `http://localhost:3000`     |

The source has local-only fallback values for typecheck and build. Use a separate database for this example, and do not deploy with the fallback secret.

## Schema workflow

`apps/web/deesse.config.ts` owns the example database connection, Deesse runtime, and root plugin list. The Admin plugin adds Better Auth schema fields. `schema:generate` writes the generated Better Auth and Deesse Drizzle schemas; `db:generate` creates a migration for review. Apply the migration explicitly with `db:migrate`. The package and example do not use the product database or `apps/app`.
