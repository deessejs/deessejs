import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

import { APP_NAME, WEB_URL } from "@/lib/app-config"
import { DashboardSwitcher } from "@/components/headers/dashboard-switcher"
import { NavUser } from "@/components/sidebars/nav-user"

/**
 * The header the authenticated surfaces share.
 *
 * The brand link goes to the marketing site, admins can switch between
 * the workspace and admin dashboards, the "Contact us" button is a
 * placeholder, and `NavUser` carries the account menu. The
 * workspace, the account settings and the administration area each
 * mount it, so the chrome reads the same from one surface to the
 * next.
 *
 * Two slots make it fit the surfaces that need more or less. The
 * `leading` slot renders before the brand, which is where the
 * workspace puts the button that opens the rail. The `user` flag
 * decides whether the account menu is in the header: the workspace
 * shows it in the rail's footer instead, and a viewport with the same
 * menu twice is a redundancy the product does not need.
 */
export function AppHeader({
  leading,
  user = true,
  surface = "workspace",
}: {
  leading?: ReactNode
  user?: boolean
  surface?: "admin" | "workspace"
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        {leading}
        <Link
          href={WEB_URL}
          aria-label={`${APP_NAME}: back to home`}
          className="min-w-0 truncate text-xl font-semibold tracking-tight hover:opacity-80"
        >
          {APP_NAME}
        </Link>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <DashboardSwitcher currentSurface={surface} />
        {/* V1 placeholder: the real action (mailto: or external helpdesk
            URL) ships in a follow-up change. */}
        <Button variant="outline" size="default" type="button" disabled>
          Contact us
        </Button>
        {user && <NavUser />}
      </div>
    </header>
  )
}
