import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Generic shared-border cell. Local to pricing.
 */
function Cell({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn("flex flex-col p-6", className)}>{children}</div>
}

/**
 * Final CTA — 2-col shared-border block with copy on the left and
 * install / browse actions on the right. No trailing border (the
 * `GlobalLayout` outline closes the page).
 */
export function FinalCta() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
      <Cell className="gap-2 lg:!p-10">
        <p className="text-label-13 text-muted-foreground">Ready to ship?</p>
        <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-foreground text-balance [&:not(:first-child)]:mt-0">
          Start with a template. Keep the contracts.
        </h2>
        <p className="text-copy-16 text-muted-foreground leading-7 max-w-xl [&:not(:first-child)]:mt-0">
          Install the CLI, pick a starter, and your agent gets every
          contract it needs to navigate the rest of the project.
        </p>
      </Cell>
      <Cell className="items-stretch justify-center gap-4 lg:!p-10">
        <Button asChild size="lg">
          <Link href="/knowledge-base/guides/install-deessejs-cli">
            Install the CLI
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/templates">Browse the registry</Link>
        </Button>
      </Cell>
    </div>
  )
}
