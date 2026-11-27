# DeesseJS Next.js shadcn admin example

This private example keeps the existing `next-shadcn-monorepo` example intact and opts into Deesse's built-in Admin plugin from a separate Next.js App Router host. It uses the repository's root pnpm workspace, dependency catalog, lockfile, and Turbo configuration. The shared UI workspace is named `@deesse-admin-example/ui` to avoid a workspace name collision.

The app imports `admin` from `deesse/plugins/admin`, `AdminPage` from `deesse/plugins/admin/next`, and `blogAdminPages` from `deesse/plugins/blog/admin`, then explicitly passes the page definitions to `admin({ pages })`. The Blog plugin contributes one static `/admin/blog` management page and typed published and administrator-only procedures. The optional catch-all Server Component passes only the runtime to `AdminPage`, which reads the pages from the admin plugin's processed runtime output. The built-in Admin plugin owns page matching, navigation, unknown-path not-found behavior, and dashboard access checks; Blog independently enforces administrator authorization in its server procedures.

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

Open `http://localhost:3000`, create a user, and visit `/admin`. A regular user sees an access-denied state. To bootstrap an administrator, run this operator command from the example app directory after applying the migration:

```sh
cd examples/next-shadcn-admin/apps/web
pnpm exec auth create-admin --config ./.deesse/tooling/auth.config.ts --email admin@example.com --name "Admin" --role admin
```

The pinned Better Auth CLI prompts for the password when `--password` is omitted. The generated config imports `deesse.config.ts` and uses its configured Deesse/Better Auth runtime, database adapter, and Admin plugin. Prerequisites are the generated `.deesse/tooling/auth.config.ts`, the same `DATABASE_URL` and `BETTER_AUTH_SECRET` as the app, and the migrated Better Auth schema. The command creates the account through Better Auth's server-side `auth.api.createUser`; it does not expose a signup or claim endpoint. If any users already exist, Better Auth asks for confirmation before creating another administrator. Do not use `--force` or `--yes` casually. If the email already belongs to an account, creation fails and leaves that account unchanged; use a different operator-approved address for recovery. The command is operator-run and can create additional admins after explicit confirmation, so restrict access to the app environment and database credentials.

With the server running and the example database migrated, exercise the protected route and shared API with:

```sh
pnpm --filter @deesse-admin-example/web smoke
```

The smoke script checks anonymous redirects and authenticated non-admin denial on the root and Blog admin routes. It exercises Better Auth's `create-admin` CLI against the isolated PostgreSQL database, verifies the persisted admin role and sign-in, confirms duplicate-email creation is refused without changing the account, then checks published reads, admin API authorization, access to a page beyond the first 100 posts, and the post draft/publish/unpublish/delete lifecycle. Package tests cover nested page rendering and the unknown-path `notFound()` response. No migration runs during server startup.

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
