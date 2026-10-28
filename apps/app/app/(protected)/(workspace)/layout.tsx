import type { ReactNode } from "react"
import { cookies } from "next/headers"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { SIDEBAR_COOKIE_NAME } from "@workspace/ui/lib/sidebar"

import { AppHeader } from "@/components/headers/app-header"
import { AppSidebar } from "@/components/sidebars/app-sidebar"

/**
 * Chrome for the workspace pages.
 *
 * The workspace is `/[organization_slug]/*`: the URL says which
 * organization the page belongs to. The organization's own navigation
 * arrives with the workspace shell, so this layout carries the rail,
 * the header the authenticated surfaces share, and nothing else.
 *
 * The rail's open state is read from the cookie the sidebar writes.
 * The component only writes it, so without this read the preference
 * would be lost on every full reload and the rail would open again
 * whatever the caller had chosen.
 *
 * The inset is the page's `<main>`, so the content below it is a
 * plain `<div>`.
 */
export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <AppHeader leading={<SidebarTrigger />} user={false} />
        <div className="flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
