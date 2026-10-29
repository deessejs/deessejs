import type { ReactNode } from "react"
import { Suspense } from "react"
import { cookies } from "next/headers"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { SIDEBAR_COOKIE_NAME } from "@workspace/ui/lib/sidebar"

import { AppHeader } from "@/components/headers/app-header"
import { PageSkeleton } from "@/components/loading/page-skeleton"
import { WorkspaceSidebar } from "@/components/sidebars/workspace-sidebar"

/**
 * Chrome for the workspace pages.
 *
 * The workspace is `/[organization_slug]/*`: the URL says which
 * organization the page belongs to. WorkspaceSidebar selects the
 * workspace or organization-settings navigation from the current route.
 * The layout carries the rail, the shared authenticated header, and
 * nothing else.
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
      <WorkspaceSidebar />
      <SidebarInset>
        <AppHeader leading={<SidebarTrigger />} user={false} />
        <div className="flex-1 p-6">
          {/* The organization layout can await an access check. Keep the
              shared chrome visible while that request resolves. */}
          <Suspense
            fallback={
              <PageSkeleton label="Loading workspace page" variant="cards" />
            }
          >
            {children}
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
