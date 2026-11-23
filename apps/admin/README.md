# @deessejs/admin

The first DeesseJS admin dashboard integration for Next.js App Router applications. It contributes Better Auth's Admin plugin and the Overview page to the shared Deesse runtime. Other Deesse plugins can contribute statically imported pages to the same runtime registry.

## Install and configure

Register the plugin with the same Deesse runtime that serves the application API:

```ts
import { createDeesse } from "deesse"
import { admin } from "@deessejs/admin"

export const deesse = createDeesse({
  database,
  auth: { baseURL, secret },
  plugins: [admin()],
})
```

Mount `AdminPage` from a server page in the Next.js App Router:

```tsx
import { AdminPage } from "@deessejs/admin/next"
import { deesse } from "@/lib/deesse"

export default function AdminRootPage() {
  return <AdminPage runtime={deesse} signInPath="/login" />
}
```

The integration reads request headers on the server, calls `runtime.auth.api.getSession()`, redirects anonymous visitors to `signInPath`, and renders an access-denied page for signed-in users without the Better Auth `admin` role. It then resolves the requested page from `runtime.admin.pages`; unknown paths use Next.js `notFound()`. Optional page authorization callbacks run server-side after the dashboard role check and can only narrow access. The package does not create another auth client, database connection, or API transport.

Feature plugins register pages with `adminPage` in their Deesse contribution. Page components are imported directly into plugin source so the bundler can include them statically:

```tsx
import { adminPage } from "@deessejs/admin"
import { plugin } from "deesse"
import { ReportsPage } from "./reports-page.js"

export const reportsPlugin = plugin({
  id: "reports",
  requires: ["admin"],
  handler: () => ({
    admin: {
      pages: [adminPage({ path: "reports", title: "Reports", component: ReportsPage })],
    },
  }),
})
```

The consuming application owns its Tailwind v4 build and shadcn theme. Import Tailwind once in its global stylesheet, then import the admin stylesheet. The admin stylesheet registers the package's compiled components with Tailwind's source scanner and does not add preflight or define global theme values:

```css
@import "tailwindcss";
@import "@deessejs/admin/styles.css";
```

The shell uses semantic shadcn utilities such as `bg-background`, `text-foreground`, `bg-card`, and `border-border`. The host's CSS variables remain the theme source of truth. This follows the package-preset integration used by [Fumadocs themes](https://www.fumadocs.dev/docs/ui/theme); Tailwind v4 source registration is documented in [Tailwind's source detection guide](https://tailwindcss.com/docs/detecting-classes-in-source-files).

The admin frame is specific to this package and does not define reusable UI primitives or depend on the private `@workspace/ui` package. When the public `@deessejs/ui` workspace is available, the dependency should point from admin to UI, and the shell can use its shared components without changing the runtime page contribution contract.

The Better Auth Admin plugin adds user and session fields. Generate and review the application's Better Auth schema and migration using its existing schema workflow before applying the migration. Promote an authorized admin user through Better Auth's supported admin bootstrap workflow.

## Package checks

```sh
pnpm --filter @deessejs/admin typecheck
pnpm --filter @deessejs/admin build
pnpm --filter @deessejs/admin lint
pnpm --filter @deessejs/admin test
```
