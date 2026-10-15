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
 * serializable string. See the doc comment on
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

  if (pathname === "/") {
    return <StarterSiteHeader />
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg"
            aria-label={`${APP_NAME} home`}
          >
            <svg
              width="20"
              height="17.5"
              viewBox="0 0 109 95"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="text-foreground"
            >
              <path
                d="M36.377 61.0078L16.877 94.5078H0.876953L28.377 48.0078L36.377 61.0078Z"
                fill="currentColor"
              />
              <path
                d="M43.877 94.0078H27.877L46.877 62.0078V61.0078L33.877 38.5078L41.377 25.0078L62.877 61.5078L43.877 94.0078Z"
                fill="currentColor"
              />
              <path
                d="M107.877 94.0078H54.877L62.877 80.0078H99.877L107.877 94.0078Z"
                fill="currentColor"
              />
              <path
                d="M94.877 71.0078H78.877L46.877 15.0078L54.877 1.00781L94.877 71.0078Z"
                fill="currentColor"
              />
              <path
                d="M36.377 61.0078L16.877 94.5078H0.876953L28.377 48.0078L36.377 61.0078Z"
                stroke="currentColor"
              />
              <path
                d="M43.877 94.0078H27.877L46.877 62.0078V61.0078L33.877 38.5078L41.377 25.0078L62.877 61.5078L43.877 94.0078Z"
                stroke="currentColor"
              />
              <path
                d="M107.877 94.0078H54.877L62.877 80.0078H99.877L107.877 94.0078Z"
                stroke="currentColor"
              />
              <path
                d="M94.877 71.0078H78.877L46.877 15.0078L54.877 1.00781L94.877 71.0078Z"
                stroke="currentColor"
              />
            </svg>
            <span className="hidden sm:inline">{APP_NAME}</span>
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
            className="hidden items-center gap-2 px-3 sm:flex"
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

function StarterSiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold" aria-label="DeesseJS home">
          <svg width="20" height="18" viewBox="0 0 109 95" fill="none" aria-hidden="true" className="text-foreground">
            <path d="M36.377 61.0078L16.877 94.5078H0.876953L28.377 48.0078L36.377 61.0078Z" fill="currentColor" />
            <path d="M43.877 94.0078H27.877L46.877 62.0078V61.0078L33.877 38.5078L41.377 25.0078L62.877 61.5078L43.877 94.0078Z" fill="currentColor" />
            <path d="M107.877 94.0078H54.877L62.877 80.0078H99.877L107.877 94.0078Z" fill="currentColor" />
            <path d="M94.877 71.0078H78.877L46.877 15.0078L54.877 1.00781L94.877 71.0078Z" fill="currentColor" />
          </svg>
          <span>DeesseJS</span>
          <span className="hidden border-l border-border pl-2 font-mono text-xs font-normal text-muted-foreground sm:inline">SAAS STARTER</span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="https://docs.deessejs.com/getting-started" className="hover:text-foreground">Docs</Link>
          <Link href="/blog" className="hover:text-foreground">Blog</Link>
          <Link href="/changelog" className="hover:text-foreground">Changelog</Link>
          <Link href="https://github.com/deessejs/saas-template" target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</Link>
          <Link href="https://docs.deessejs.com/getting-started" className="bg-foreground px-4 py-2 font-medium text-background hover:opacity-85">Get started</Link>
        </nav>
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon" aria-label="Open navigation menu"><Menu className="size-4" /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex flex-col gap-6 bg-background p-6">
            <Link href="/" className="font-semibold text-lg">DeesseJS</Link>
            <nav aria-label="Main navigation" className="flex flex-col gap-4 text-sm">
              <Link href="https://docs.deessejs.com/getting-started">Getting started</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/changelog">Changelog</Link>
              <Link href="https://github.com/deessejs/saas-template" target="_blank" rel="noreferrer">GitHub repository</Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
