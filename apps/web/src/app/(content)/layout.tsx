import * as React from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

import { MarketingPage } from "../(marketing)/_components/marketing-page"

/**
 * Page-level wrapper for every page in the `(content)` route group.
 *
 * Reuses the same outer container, shared-border card, and
 * diagonal-stripe framing as the `(marketing)` group via
 * `MarketingPage`, so the visual signature of the site is
 * consistent across surfaces. Pages render their content directly
 * as children — no additional `<article>` or `<div>` wrapper is
 * needed at this level (pages may still wrap their inner content
 * in their own `<section>` or `<article>` for semantic purposes).
 *
 * Closes every content page with a shared final CTA, identical in
 * shape to the homepage's "Use the templates. Or ship with us."
 * block so visitors hit the same conversion lever regardless of
 * which content surface they arrived on.
 */
export default function ContentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MarketingPage>
      {children}

      {/* Final CTA — same 2-col shared-border grid as the homepage
          hero. Copy on the left, three actions on the right, plus a
          GitHub outbound. Generic across blog / changelog /
          knowledge-base so the conversion lever is consistent. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
        <div className="flex flex-col gap-4 p-6 lg:p-10">
          <p className="text-label-13 text-muted-foreground">
            Ready to ship?
          </p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
            Read more, or ship with us.
          </h2>
          <p className="text-copy-16 text-muted-foreground leading-7 max-w-xl [&:not(:first-child)]:mt-0">
            Subscribe to the blog and changelog feeds, install the
            CLI to scaffold a project in under five minutes, or talk
            to our delivery team if you need a hand. Same templates,
            same contracts, same guarantees.
          </p>
        </div>
        <div className="flex flex-col items-stretch justify-center gap-4 p-6 lg:p-10">
          <Button asChild size="lg">
            <Link href="/knowledge-base/guides/install-deessejs-cli">
              Install the CLI
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/templates">Browse the registry</Link>
          </Button>
        </div>
      </div>
    </MarketingPage>
  )
}
