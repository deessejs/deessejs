import type { ReactNode } from "react"
import { cookies } from "next/headers"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { SIDEBAR_COOKIE_NAME } from "@workspace/ui/lib/sidebar"

import { AppHeader } from "@/components/headers/app-header"
import { SettingsSidebar } from "@/components/sidebars/settings-sidebar"

/**
 * Chrome for the `/account/settings/*` route area.
 *
 * The account-scoped sidebar and header live here. The workspace's
 * navigation belongs to a different scope and surface. The sidebar
 * state follows the shared cookie used by the other authenticated
 * layouts. The proxy at `apps/app/proxy.ts` enforces auth and email
 * verification; the layout does not re-check.
 */
export default async function AccountLayout({
  children,
}: {
  children: ReactNode
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <SettingsSidebar />
      <SidebarInset>
        <AppHeader leading={<SidebarTrigger />} user={false} />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
