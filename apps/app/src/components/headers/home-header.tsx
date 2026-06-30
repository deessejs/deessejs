import Link from "next/link"

import { ArrowRight } from "lucide-react"

import { Button } from "@workspace/ui/components/ui/button"

// Header uses the plain max-w-7xl container without the editorial
// border-x frame (the border only applies to the main content area).
const containerClass = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"

const navLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Changelog", href: "/changelog" },
  { label: "Docs", href: "https://docs.deessejs.com" },
  { label: "Demo", href: "https://demo.deessejs.com" },
]

/**
 * HomeHeader — sticky top nav for the marketing site.
 *
 * Logo + 5 nav links on the left, 2 CTAs (Sign in ghost, Get started
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
            {navLinks.map((link) => {
              const isExternal = link.href.startsWith("http")
              const className =
                "text-sm text-muted-foreground transition-colors hover:text-foreground"
              return isExternal ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className={className}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/login" />}>
            Sign in
          </Button>
          <Button nativeButton={false} render={<Link href="/signup" />}>
            Get started
            <ArrowRight />
          </Button>
        </div>
      </div>
    </header>
  )
}
