# @deessejs/admin

The first DeesseJS admin dashboard integration for Next.js App Router applications. It contributes Better Auth's Admin plugin to the shared Deesse runtime and provides a server-rendered empty dashboard guarded by the current request's Better Auth session and `admin` role.

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

The integration reads request headers on the server, calls `runtime.auth.api.getSession()`, redirects anonymous visitors to `signInPath`, and renders an access-denied page for signed-in users without the Better Auth `admin` role. It does not create another auth client, database connection, or API transport. The dashboard is intentionally empty in this first slice; plugin-contributed pages are deferred.

Import the package stylesheet from the application's global CSS file so the shell uses the host's shadcn CSS variables:

```css
@import "@deessejs/admin/styles.css";
```

The Better Auth Admin plugin adds user and session fields. Generate and review the application's Better Auth schema and migration using its existing schema workflow before applying the migration. Promote an authorized admin user through Better Auth's supported admin bootstrap workflow.

## Package checks

```sh
pnpm --filter @deessejs/admin typecheck
pnpm --filter @deessejs/admin build
pnpm --filter @deessejs/admin lint
pnpm --filter @deessejs/admin test
```
