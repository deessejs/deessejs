import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

import { APP_NAME, WEB_URL } from "@/lib/app-config"
import { NavUser } from "@/components/sidebars/nav-user"

/**
 * The header the authenticated surfaces share.
 *
 * The brand link goes to the marketing site, the "Contact us" button
 * is a placeholder, and `NavUser` carries the account menu. The
 * workspace, the account settings and the administration area each
 * mount it, so the chrome reads the same from one surface to the
 * next.
 */
export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
      <Link
        href={WEB_URL}
        aria-label={`${APP_NAME}: back to home`}
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
  )
}
