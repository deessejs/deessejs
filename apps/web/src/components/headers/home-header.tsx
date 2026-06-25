import Link from "next/link"

import { ArrowRight } from "lucide-react"

import { Button } from "@workspace/ui/components/ui/button"

// Header uses the plain max-w-7xl container without the editorial
// border-x frame (the border only applies to the main content area).
const containerClass = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"

const navLinks = [
  { label: "Pricing", href: "#" },
  { label: "Changelog", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Docs", href: "#" },
]

/**
 * HomeHeader — sticky top nav for the marketing site.
 *
 * Logo + 4 nav links on the left, 2 CTAs (Sign in ghost, Get started
 * primary) on the right. Backdrop blur on scroll, border-b to
 * separate from the main content.
 *
 * Uses Next.js `Link` for client-side navigation.
 */
export function HomeHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div
        className={`${containerClass} flex h-14 items-center justify-between`}
      >
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight"
          >
            DeesseJS
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            Sign in
          </Button>
          <Button>
            Get started
            <ArrowRight />
          </Button>
        </div>
      </div>
    </header>
  )
}
