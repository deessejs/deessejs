# @deessejs/admin

A Next.js App Router dashboard integration for Deesse applications. This package owns the admin page definitions, path normalization, route resolution, navigation, Better Auth role check, and optional page authorization. Deesse core remains admin-agnostic.

## Configure

Register `admin()` as a Deesse plugin with statically imported page definitions. The plugin handler processes its input once, adds Better Auth's Admin plugin to the shared auth composition, and retains the resolved pages in its plugin output:

```tsx
import { createDeesse } from "deesse"
import { admin } from "@deessejs/admin"
import { reportsAdminPages } from "./plugins/reports/admin/page.js"

export const deesse = createDeesse({
  database,
  auth: { baseURL, secret },
  plugins: [reportsPlugin(), admin({ pages: [...reportsAdminPages] })],
})
```

Mount the catch-all from a server page in the host application's Next.js App Router:

```tsx
import { AdminPage } from "@deessejs/admin/next"
import { deesse } from "@/lib/deesse"

export default async function AdminRoute({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  return <AdminPage runtime={deesse} path={slug?.join("/") ?? "/"} signInPath="/login" />
}
```

`AdminPage` finds the plugin output using the id declared by the admin plugin definition through `runtime.plugins.get()`. It reads request headers on the server, reuses `runtime.auth.api.getSession()`, redirects anonymous visitors, and denies signed-in users without Better Auth's `admin` role. It resolves pages from that plugin output and calls Next.js `notFound()` for unknown paths. Optional page authorization runs server-side after the dashboard role check and can only narrow access. The package creates no separate auth client, database connection, or API transport.

Feature plugins remain admin-agnostic. An optional feature adapter can export page definitions for the application to configure:

```tsx
import { adminPage } from "@deessejs/admin"
import { ReportsPage } from "./reports-page.js"

export const reportsAdminPages = [
  adminPage({ path: "reports", title: "Reports", component: ReportsPage }),
] as const
```

Page components are statically imported at build time. The application's Tailwind v4 build registers package styles from `node_modules` with the package stylesheet; it does not add a second Tailwind build, preflight, or global palette:

```css
@import "tailwindcss";
@import "@deessejs/admin/styles.css";
```

The shell uses semantic shadcn utilities and host theme tokens. The package does not depend on private product UI primitives; it is intended to consume the public `@deessejs/ui` package when that independent package is available.

## Checks

```sh
pnpm --filter @deessejs/admin typecheck
pnpm --filter @deessejs/admin build
pnpm --filter @deessejs/admin lint
pnpm --filter @deessejs/admin test
```
