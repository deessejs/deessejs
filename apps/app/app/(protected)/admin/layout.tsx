import type { ReactNode } from "react"

import { requireAdmin } from "@/lib/admin-auth"

/**
 * Layout for the `/admin/*` route area (RFC: "DeesseJS Administration
 * Routes — V1" §6.2).
 *
 * The layout calls `requireAdmin()` once, before rendering children.
 * Per the same RFC, every page in `/admin/*` must also call the guard
 * at the top of its body — layouts can persist across navigation in
 * Next.js 16, so the layout-level check is a *convenience* that keeps
 * the visual shell from mounting, never the *authoritative* access
 * decision. The page-level call is what actually authorizes the
 * content.
 *
 * The layout renders no shell: the parent `(protected)/layout.tsx`
 * already provides the application header, the left `SettingsRail`,
 * and the `<main>` container. Adding a second shell here would
 * duplicate the chrome and break the standard app navigation.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAdmin()
  return <>{children}</>
}
