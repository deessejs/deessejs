# deesse

DeesseJS core and its typed React client. This PR adds the first bounded PostgreSQL runtime slice. It is not a complete V1 framework implementation.

## Executable runtime slice

`createDeesse()` validates plugin IDs and dependency edges, orders root-level plugins, and invokes each handler once during composition. It creates Better Auth from the configured auth options and adapter, composes application and plugin routers, and exposes a Hono Fetch handler. Hono mounts Better Auth at `/api/auth/*` and oRPC at `/api/rpc/*`. Each RPC request resolves its Better Auth session and passes request headers, user, and session into the oRPC context. No migration or database write is performed during startup.

`deesse/next` exports `toNextJsHandler(instance)` as a Hono Vercel/Next host bridge. `deesse/react` creates a Better Auth React client and a router-derived oRPC client with the same `/api/auth` and `/api/rpc` paths. A client uses one explicit options object: `createClient({ server: deesseServer<typeof deesse>(), auth: { plugins: [...] } })`. `DeesseServer<typeof deesse>` projects only the composed oRPC router from the type-only server reference. The `server` field is separate from Better Auth's client options, and it is removed before Better Auth client construction. Apps without extra auth fields can omit `auth` entirely; they do not need `inferAdditionalFields`. Better Auth client plugins retain their own inferred methods and session/user types through the nested `auth.plugins` option. Use Better Auth helpers for genuinely configured extra auth fields, and pair custom auth endpoints with Better Auth client plugins carrying `$InferServerPlugin`. The compile-time fixtures assert exact oRPC procedure input/output types, the router-only server projection, and Better Auth plugin method/session types from the same client call.

`createPluginApi(schema)` creates an oRPC builder whose request context uses the stable Deesse database service and standard request-scoped auth fields. The schema argument infers the plugin's model operations without rebuilding the context type in the host app.

Runtime tests use Better Auth's in-memory adapter only as an isolated test double for composition and host behavior. The PostgreSQL adapter integration suite uses a real PostgreSQL URL, and proves the operations, transactions, auth persistence and session flow described below when run with the CI PostgreSQL service.

## Bounded database type contract

The revised RFC's V1 schema and service contract is represented in public types. `DeesseDatabaseSchema` models named models, typed fields, static defaults, nullability, uniqueness, and indexes. `DeesseModelRow` maps schema fields to row values and adds the generated string `id`. `DeesseDatabaseService` types `findById`, bounded `findMany` with equality and `in` filters plus ordering, `insert`, `updateById`, `deleteById`, and a transaction-scoped service without nested transactions. Results include the RFC's typed `NOT_FOUND` outcome and the declared conflict, unsupported-capability, and infrastructure categories. JSON fields accept JSON values only.

Plugin schema contributions are merged with the adapter schema in the inferred instance service type. The compile-time fixture exercises adapter-owned and plugin-owned models through that composed type, and rejects unknown models, fields, query values, invalid limits, and invalid writes. `DatabaseAdapter` pairs the portable service with Better Auth's official database-adapter option type. The portable service does not expose a provider client.

`@deessejs/drizzle-adapter` implements the bounded PostgreSQL service using an app-owned postgres-js Drizzle client and derives Better Auth's official Drizzle adapter from that same client. It implements the declared CRUD/query and transaction behavior, and has a real PostgreSQL integration suite. The schema generator invokes plugin handlers and emits a Deesse-owned Drizzle schema without database access. In a consuming application, Better Auth's CLI remains authoritative for auth schema output, and the application runs its own Drizzle Kit migration workflow. Server startup performs schema registration only, never DDL.

The adapter's PostgreSQL schemas and migrations used by its integration tests are isolated under `apps/deesse-drizzle-adapter/tests/fixtures`. They do not participate in the monorepo product database schema or migrations. Applications own their postgres-js client and pool lifecycle and pass their configured Drizzle database to the adapter.

## Type model boundaries

Compile-time assertions preserve `DeesseConfig` and direct `createDeesse({ database, auth, api, plugins })` inference, including optional API/plugins, Zod raw versus parsed args, no-config plugins, router input/output, Better Auth plugin types, the exact instance shape, and the standalone `DeessePluginContributionRegistry<TPlugins>`. The registry is type-only and is not a runtime registry or a property on `DeesseInstance`.

The oRPC request context type includes the stable database service, request, headers, user, and session; the runtime passes those request-scoped values. Plugin auth schema contributions are collected in the type-only contribution registry. Extension values are checked manually with `PluginExtension`; `requires` does not infer provider-to-consumer extension validation. Runtime dependency ordering and missing/cycle/duplicate checks are implemented, but schema conflict and provider extension compatibility checks are not. The app supplies Better Auth client plugins when it constructs the React client; they are not automatically derived from server contributions. The contribution registry remains type-only and is not exposed on `DeesseInstance`.

The package build emits declarations and typechecks consumer fixtures through the public `deesse`, `deesse/react`, `deesse/next`, `deesse/plugins/blog`, `deesse/plugins/blog/admin`, `deesse/plugins/admin`, and `deesse/plugins/admin/next` exports. React, React DOM, Next.js, and `@deessejs/ui` are optional peers used only by the corresponding client and UI subpaths. Applications that use only Deesse core or server plugins do not need them. The database adapter integration requires a real PostgreSQL service and is exercised in CI. This slice supports postgres-js only, the bounded plugin-declared schema and operations above, and the current installed compatibility baseline. It does not implement general collections or relationship behavior, node-postgres or other dialects, public blog rendering, a production example application, or the rest of V1. Runtime detection of incompatible schemas is limited to registration and operation validation; migration review and application remain explicit operator steps.

## Blog plugin

`deesse/plugins/blog` exports only the database-backed Blog plugin. Its optional React page definition is available from `deesse/plugins/blog/admin`. Compose both capabilities explicitly in an application that opts in to a dashboard:

```tsx
import { admin } from "deesse/plugins/admin"
import { blogPlugin } from "deesse/plugins/blog"
import { blogAdminPages } from "deesse/plugins/blog/admin"

plugins: [blogPlugin(), admin({ pages: [...blogAdminPages] })]
```

`admin({ pages })` is opt-in and adds the Better Auth Admin plugin plus a default Overview page. `deesse/plugins/admin/next` exports the Next.js `AdminPage`, and `deesse/plugins/admin/styles.css` registers its Tailwind utility usage. The Blog plugin stores Markdown source in one `posts` model, exposes published reads and administrator-only management procedures at `client.api.blog`, and contributes one page at `/admin/blog` through the optional subpath. The host owns schema generation and migrations. The plugin never runs DDL during runtime composition. `deesse/plugins/blog` has no React or Next.js runtime import.

Install the optional peers only when using the React or Admin UI subpaths:

```sh
pnpm add react react-dom next @deessejs/ui
```

Mount the Admin renderer from a Next.js App Router catch-all Server Component. It reads the session from the runtime, redirects anonymous users, denies signed-in users without the administrator role, and returns Next's not-found response for unregistered pages:

```tsx
import { AdminPage } from "deesse/plugins/admin/next"
import { deesse } from "@/lib/deesse"

export default async function AdminRoute({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await params
  return <AdminPage runtime={deesse} path={slug?.join("/") ?? "/"} signInPath="/login" />
}
```

The app's Tailwind v4 stylesheet registers both UI packages' component sources:

```css
@import "tailwindcss";
@import "@deessejs/ui/tailwind.css";
@import "deesse/plugins/admin/styles.css";
```

Feature plugins own and export their page definitions. The application statically imports those definitions and passes the complete list to `admin({ pages })`; the Admin plugin does not discover or aggregate pages automatically. To add another administrator, run Better Auth's `create-admin` command using the app's generated auth config and migrated database:

```sh
pnpm exec auth create-admin --config ./path/to/auth.config.ts --email admin@example.com --name "Admin" --role admin
```

The former standalone `@deessejs/admin` package is retired. Admin consumers now import the plugin, Next renderer, and stylesheet from their corresponding Deesse subpaths. This Changeset requests a Deesse major release, moving the published 0.4.x line to 1.0.0 during release preparation. The Drizzle adapter now declares compatibility with Deesse 1.x and carries its own major Changeset. The existing Admin npm package is not modified by this PR, and future Admin releases ship as part of `deesse`.
