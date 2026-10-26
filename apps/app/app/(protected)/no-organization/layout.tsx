import type { ReactNode } from "react"

import { AppHeader } from "@/components/headers/app-header"

/**
 * Chrome for the empty state.
 *
 * The page is where a caller with no organization lands, and it is a
 * full page of its own: the header the authenticated surfaces share,
 * and the page's content.
 */
export default function NoOrganizationLayout({
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
