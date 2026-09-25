import * as React from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

import { MarketingPage } from "../_components/marketing-page"

/**
 * Page-level wrapper for every page in `/components` and its
 * category / leaf routes. Reuses the same outer container,
 * shared-border card, and diagonal-stripe framing as `/blog` and
 * `/changelog` so the visual signature of the site is uniform.
 *
 * Closes every page with a shared 2-col final CTA, identical in
 * shape to `(content)/layout.tsx`'s CTA so visitors hit the same
 * conversion lever regardless of which surface they arrived on.
 */
export default function ComponentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MarketingPage>
      {children}

      {/* Final CTA — same 2-col shared-border grid as the homepage
          hero. Copy on the left, two actions on the right. Generic
          across /components and its sub-pages. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
        <div className="flex flex-col gap-4 p-6 lg:p-10">
          <p className="text-label-13 text-muted-foreground">
            Ready to ship?
          </p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
            Browse the registry, or ship with us.
          </h2>
          <p className="text-copy-16 text-muted-foreground text-pretty leading-7 max-w-xl [&:not(:first-child)]:mt-0">
            Install the CLI to scaffold a project in under five
            minutes, or talk to our delivery team if you need a hand.
            Same templates, same contracts, same guarantees.
          </p>
        </div>
        <div className="flex flex-col items-stretch justify-center gap-4 p-6 lg:p-10">
          <Button asChild size="lg">
            <Link href="/templates">
              Browse templates
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a
              href="https://github.com/deessejs/deessejs"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </Button>
        </div>
      </div>
    </MarketingPage>
  )
}