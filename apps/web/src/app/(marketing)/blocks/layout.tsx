import * as React from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

/**
 * Page-level wrapper for every page in `/blocks` and its category
 * / leaf routes. Renders the children directly (the shared-border
 * card + diagonal stripes are now supplied by `<GlobalLayout>` at
 * the root layout) and closes with the shared 2-col Final CTA.
 *
 * Mirror of `(marketing)/components/layout.tsx`.
 */
export default function BlocksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}

      {/* Final CTA — same 2-col shared-border grid as the homepage
          hero. Copy on the left, two actions on the right. No
          install command: blocks aren't published through the
          shadcn registry yet (ITEMS.blocks is empty), so we
          don't promise a copy-paste install. Once the first
          block lands, swap this copy for the shadcn install
          flow used by /components. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
        <div className="flex flex-col gap-4 p-6 lg:p-10">
          <p className="text-label-13 text-muted-foreground">
            Ready to ship?
          </p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
            Need a section we don&apos;t ship yet?
          </h2>
          <p className="text-copy-16 text-muted-foreground text-pretty leading-7 max-w-xl [&:not(:first-child)]:mt-0">
            Blocks are still being carved out of the marketing
            pages. Until they land in the registry, talk to our
            delivery team if you need a hand porting a layout
            into your project. Same templates, same contracts,
            same guarantees.
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
    </>
  )
}
