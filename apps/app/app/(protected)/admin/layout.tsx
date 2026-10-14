import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

import { APP_NAME, WEB_URL } from "@/lib/app-config"
import { NavUser } from "@/components/sidebars/nav-user"
import { requireAdmin } from "@/lib/admin-auth"

/**
 * Layout for the `/admin/*` route area (RFC: "DeesseJS Administration
 * Routes — V1" §6.2).
 *
 * Admin is a *sibling* of the dashboard under the `(protected)` route
 * group, not a sub-screen of it: the parent `(protected)/layout.tsx`
 * is now a passthrough and the dashboard owns its own header +
 * `SettingsRail` in `(protected)/dashboard/layout.tsx`. Admin gets
 * its own shell here — a header with the same `APP_NAME` link,
 * `Contact us` placeholder, and `NavUser` for brand consistency, but
 * **no** left `SettingsRail` (the rail is dashboard-scoped). The
 * `Administration` rail entry on the dashboard still points to
 * `/admin/home` for cross-navigation.
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
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
        <Link
          href={WEB_URL}
          aria-label={`${APP_NAME} — back to home`}
          className="text-xl font-semibold tracking-tight hover:opacity-80"
        >
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-2">
          {/* V1 placeholder: the real action (mailto: or external helpdesk
              URL) ships in a follow-up change. */}
          <Button variant="outline" size="default" type="button" disabled>
            Contact us
          </Button>
          <NavUser />
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
