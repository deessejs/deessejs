"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Search } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@workspace/ui/components/sheet"
import { Button } from "@workspace/ui/components/button"
import { APP_NAME } from "@workspace/ui/lib/config"

import { useSearchDialogStore } from "@/lib/search/store"

import { NavSections } from "./nav-sections"

/**
 * Marketing site header. Sticky with a solid `bg-background` (no
 * opacity, no backdrop blur). Desktop uses the shadcn NavigationMenu
 * primitive (Radix) for the four top-level sections; mobile collapses
 * into a Sheet with categories rendered as nested groups.
 *
 * Auth state: the marketing site does not currently expose a
 * client-side session, so the right-side CTA stays as a disabled
 * "Coming soon". When the client session is wired, the desktop
 * right-side button can be replaced by an avatar dropdown without
 * changing the public URL surface.
 *
 * Both DesktopNav and MobileNav read from the same NAV_SECTIONS list
 * in nav-sections.tsx — adding a link once updates both viewports.
 */
export function SiteHeader() {
  const pathname = usePathname()
  const openSearch = useSearchDialogStore((s) => s.open)

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild className="sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-72 flex-col gap-6 p-6"
            >
              <Link href="/" className="font-semibold text-lg">
                {APP_NAME}
              </Link>
              <NavSections pathname={pathname} variant="mobile" />
              <Button
                variant="outline"
                onClick={openSearch}
                aria-label="Open search"
                aria-keyshortcuts="Meta+K Control+K"
                className="mt-4 w-full justify-start gap-2"
              >
                <Search className="size-4" />
                <span>Search...</span>
                <kbd className="ml-auto text-[10px] font-mono text-muted-foreground/60">
                  ⌘K
                </kbd>
              </Button>
              <div className="mt-auto flex flex-col gap-2">
                <Button disabled className="w-full">
                  Coming soon
                </Button>
              </div>
            </SheetContent>
          </Sheet>
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

        <div className="hidden items-center gap-2 sm:flex">
          <Button
            variant="outline"
            size="sm"
            onClick={openSearch}
            aria-label="Open search"
            aria-keyshortcuts="Meta+K Control+K"
            className="flex items-center gap-2 px-3"
          >
            <Search className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Search...</span>
            <kbd className="ml-2 hidden text-[10px] font-mono text-muted-foreground/60 md:inline">
              ⌘K
            </kbd>
          </Button>
          <Button disabled>Coming soon</Button>
        </div>
      </div>
    </header>
  )
}
