"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Menu, Search } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@workspace/ui/components/sheet"
import { Button } from "@workspace/ui/components/button"
import { APP_NAME } from "@/lib/app-config"

import { useSearchDialogStore } from "@/lib/search/store"

import { NavSections } from "./nav-sections"

/**
 * Marketing site header. Sticky with a solid `bg-background` (no
 * opacity, no backdrop blur). Desktop uses the shadcn NavigationMenu
 * primitive (Radix) for the four top-level sections; mobile collapses
 * into a Sheet with categories rendered as nested groups.
 *
 * This file is `"use client"` because `NavSections` (Radix
 * NavigationMenu) and the search dialog need browser-side state.
 * The cross-app auth UI lives in `user-menu.tsx` (also `"use client"`)
 * and is rendered into the `rightSlot` / `mobileMenuSlot` props from
 * a Server Component parent (typically `site-header-server.tsx`) —
 * that lets the URL resolved by `withRelatedProject` (which reads
 * server-only env vars) flow into the Client Component as a
 * serializable string. See ADR-029 Decision #4 + the doc comment on
 * `<UserMenuServer />` for the rationale.
 *
 * Both DesktopNav and MobileNav read from the same NAV_SECTIONS list
 * in nav-sections.tsx — adding a link once updates both viewports.
 */
export function SiteHeader({
  rightSlot,
  mobileMenuSlot,
}: {
  rightSlot: ReactNode
  mobileMenuSlot: ReactNode
}) {
  const pathname = usePathname()
  const openSearch = useSearchDialogStore((s) => s.open)

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-semibold text-lg"
            aria-label={`${APP_NAME} home`}
          >
            {APP_NAME}
          </Link>
          <div className="hidden sm:flex">
            <NavSections pathname={pathname} variant="desktop" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openSearch}
            aria-label="Search content"
            aria-keyshortcuts="Meta+K Control+K"
            className="flex items-center gap-2 px-3"
          >
            <Search className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Search content</span>
            <kbd className="ml-2 hidden text-[10px] font-mono text-muted-foreground/60 md:inline">
              ⌘K
            </kbd>
          </Button>
          <div className="hidden items-center gap-2 sm:flex">
            {rightSlot}
          </div>
          <Sheet>
            <SheetTrigger asChild className="sm:hidden">
              <Button
                variant="outline"
                size="icon"
                aria-label="Open navigation menu"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex flex-col gap-6 bg-background p-6"
              style={{ width: "100vw", maxWidth: "100vw" }}
            >
              <Link href="/" className="font-semibold text-lg">
                {APP_NAME}
              </Link>
              <div className="flex flex-col gap-2">
                {mobileMenuSlot}
              </div>
              <NavSections pathname={pathname} variant="mobile" />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
