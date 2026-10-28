import type { ReactNode } from "react"

import { AppHeader } from "@/components/headers/app-header"

/**
 * Chrome for the organizations page.
 *
 * The page is a full page of its own: the header the authenticated
 * surfaces share, and the page's content. The page carries its own
 * container and its own padding, so the content is centred the way
 * the page wants it.
 */
export default function OrganizationsLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
    </div>
  )
}
