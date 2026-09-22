import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

/**
 * Final CTA — single CTA, no pricing/OSS links.
 *
 * The previous version of this page ended with a three-button block
 * (Install CLI / Talk to delivery / Browse the registry) that
 * undermined the enterprise promise: after selling "senior engineer,
 * DPAs, multi-week engagements" at the top, linking to a $299
 * self-service product at the bottom created a cognitive
 * dissonance. The CTA now points to /delivery — the right exit
 * for a visitor who has finished reading the engagement model.
 *
 * `/delivery` lives at `apps/web/src/app/(marketing)/delivery/` —
 * same Next.js app as /enterprise, no cross-app URL composition
 * needed. A relative `<Link href="/delivery">` is enough.
 */
export function FinalCta() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
      <div className="flex flex-col gap-4 p-6 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Ready to ship?
        </p>
        <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
          Have specific architecture requirements?
        </h2>
        <p className="text-copy-16 text-muted-foreground leading-7 max-w-xl [&:not(:first-child)]:mt-0">
          A senior engineer joins your channel, we agree on a scope
          within three business days, and the codebase lands in
          your repository on a fixed cadence.
        </p>
      </div>
      <div className="flex flex-col items-stretch justify-center gap-4 p-6 lg:p-10">
        <Button asChild size="lg">
          <Link href="/delivery">Talk to delivery</Link>
        </Button>
      </div>
    </div>
  )
}
