import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

/**
 * Enterprise page hero — single column, centered, eyebrow + h1 +
 * lead + CTAs. No image, no split layout — the homepage pattern for
 * the highest-emphasis section on the page.
 *
 * The "Talk to us about Enterprise" CTA scrolls to the inquiry
 * form anchor (`#inquiry`); "See pricing" routes to /pricing.
 */
export function Hero() {
  return (
    <div className="flex flex-col items-center gap-6 border-b border-border p-6 text-center lg:p-16">
      <div className="flex max-w-3xl flex-col items-center gap-6">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Enterprise
        </p>
        <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
          Get your team to production in weeks, not quarters.
        </h1>
        <p className="text-muted-foreground text-copy-18 sm:text-copy-20 leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0">
          Multi-template bundles, custom scaffolding on top of a Pro
          template, weekly syncs with a senior engineer, and procurement-
          ready invoicing. Tell us what you are building and we will
          reply within two business days.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="#inquiry">Talk to us about Enterprise</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
