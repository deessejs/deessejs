import type { ReactNode } from "react"

import { AppHeader } from "@/components/headers/app-header"
import { requireAdmin } from "@/lib/admin-auth"

/**
 * Layout for the `/admin/*` route area (RFC: "DeesseJS Administration
 * Routes — V1" §6.2).
 *
 * Admin is a *sibling* of the workspace under the `(protected)`
 * route group, not a sub-screen of it: the parent
 * `(protected)/layout.tsx` is a passthrough and each surface owns its
 * own shell. Admin gets the shared header here, and **no** left
 * `SettingsRail` (the rail is account-scoped). The `Administration`
 * rail entry on the account settings still points to `/admin/home`
 * for cross-navigation.
 *
 * The layout calls `requireAdmin()` once, before rendering children.
 * Per the same RFC, every page in `/admin/*` must also call the guard
 * at the top of its body — layouts can persist across navigation in
 * Next.js 16, so the layout-level check is a *convenience* that keeps
 * the visual shell from mounting, never the *authoritative* access
 * decision. The page-level call is what actually authorizes the
 * content. The proxy only authenticates; the admin role check is
 * owned here.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAdmin()
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
