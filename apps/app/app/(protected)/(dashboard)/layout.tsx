import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

import { APP_NAME, WEB_URL } from "@/lib/app-config"
import { NavUser } from "@/components/sidebars/nav-user"
import { SettingsRail } from "@/components/nav/settings-rail"

/**
 * Chrome for the `/home` and `/settings/*` route area.
 *
 * The dashboard header (APP_NAME back-link, the disabled "Contact us"
 * placeholder, NavUser) and the left `SettingsRail` live here. The admin
 * area at `/admin/*` is a sibling of `/dashboard/*` and intentionally
 * has its own shell (see `../admin/layout.tsx`) — it does not mount
 * this rail. The proxy at `apps/app/proxy.ts` enforces auth and email
 * verification; the layout does not re-check.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
              URL) ships in a follow-up ADR. See ADR-030 §5. */}
          <Button variant="outline" size="default" type="button" disabled>
            Contact us
          </Button>
          <NavUser />
        </div>
      </header>
      <div className="flex flex-1">
        <SettingsRail />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
