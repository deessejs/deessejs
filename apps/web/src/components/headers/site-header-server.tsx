// Server Component wrapper around the Client Component
// `<SiteHeader>`.
//
// `SiteHeader` is `"use client"` (the NavigationMenu primitive and
// the search dialog need browser-side state). But the cross-app
// URL helper `withRelatedProject` reads server-only env vars
// (`VERCEL_RELATED_PROJECTS`) — it cannot run in the browser
// bundle. So we resolve `appUrl` here on the server, pass it
// through `<UserMenuServer />`, and pass the resulting Client
// Component as a children slot to `<SiteHeader>`.
//
// The pattern: a Client Component accepts `ReactNode` slots
// (`rightSlot`, `mobileMenuSlot`); a Server Component parent
// fills them with Server-rendered Client Components that hold
// server-resolved state. This is the standard Next.js App Router
// escape hatch for server-only data inside an otherwise client
// tree — see ADR-028 Decision #4 (server-resolved prop).

import { UserMenuServer } from "./user-menu-server"
import { SiteHeader } from "./site-header"

export function SiteHeaderServer() {
  return (
    <SiteHeader
      rightSlot={<UserMenuServer variant="desktop" />}
      mobileMenuSlot={<UserMenuServer variant="mobile" />}
    />
  )
}