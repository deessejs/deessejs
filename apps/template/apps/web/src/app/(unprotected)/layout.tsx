import Link from "next/link"
import type { PropsWithChildren } from "react"

import { Button } from "@deessejs/ui/components/button"

/**
 * Layout for the entire "unprotected" surface — public pages that don't
 * require auth. Wraps both (marketing) and (auth) subtrees.
 *
 * Provides the shared chrome:
 *   - Sticky slim top nav (DeesseJS brand + Log in / Sign up)
 *
 * Sub-layouts ((marketing)/layout.tsx and (auth)/layout.tsx) only add
 * their own specialized structure (footer, 2-column form shell, etc.)
 * — no need to repeat the top nav.
 *
 * The inner wrapper is `flex flex-1 flex-col` so child layouts can use
 * `flex-1` to fill the remaining vertical space.
 */
export default function UnprotectedLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav
          aria-label="Primary"
          className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6"
        >
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            DeesseJS
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              render={<Link href="/login" />}
              variant="ghost"
              nativeButton={false}
              className="hidden sm:inline-flex"
            >
              Log in
            </Button>
            <Button
              render={<Link href="/signup" />}
              variant="default"
              nativeButton={false}
            >
              Sign up
            </Button>
          </div>
        </nav>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
