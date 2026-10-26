import type { ReactNode } from "react"

import { AppHeader } from "@/components/headers/app-header"

/**
 * Chrome for the workspace pages.
 *
 * The workspace is `/[organization_slug]/*`: the URL says which
 * organization the page belongs to. The organization's own navigation
 * arrives with the workspace shell, so this layout carries the header
 * the authenticated surfaces share and nothing else.
 */
export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
