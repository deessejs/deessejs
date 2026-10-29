import type { ReactNode } from "react"
import { cookies } from "next/headers"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { SIDEBAR_COOKIE_NAME } from "@workspace/ui/lib/sidebar"

import { AppHeader } from "@/components/headers/app-header"
import { AdminSidebar } from "@/components/sidebars/admin-sidebar"
import { requireAdmin } from "@/lib/admin-auth"

/**
 * Layout for the `/admin/*` route area (RFC: "DeesseJS Administration
 * Routes — V1" §6.2).
 *
 * Admin is a sibling of the workspace under `(protected)` and owns a
 * dedicated sidebar because workspace navigation is organization-specific.
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
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminSidebar />
      <SidebarInset>
        <AppHeader leading={<SidebarTrigger />} user={false} />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
