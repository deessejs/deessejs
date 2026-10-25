import type { ReactNode } from "react"

import { AppHeader } from "@/components/headers/app-header"
import { SettingsRail } from "@/components/nav/settings-rail"

/**
 * Chrome for the `/account/settings/*` route area.
 *
 * The header and the left `SettingsRail` live here. The rail is
 * account-scoped: it lists the account's own settings, and the
 * workspace's navigation is a different scope, in a different
 * surface. The proxy at `apps/app/proxy.ts` enforces auth and email
 * verification; the layout does not re-check.
 */
export default function AccountLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <div className="flex flex-1">
        <SettingsRail />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
