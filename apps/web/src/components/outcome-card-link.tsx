"use client"

/**
 * Small client-only Link that lives in the top-right corner of an
 * Outcome card and stops click propagation so it does not also fire
 * the parent card link.
 *
 * The card already has a `<Link>` that covers the entire surface;
 * this button lives in the very corner and routes to a filtered
 * registry view (e.g. `/templates?tags=["auth"]`).
 *
 * Extracted to its own file because Next.js requires any element
 * with an `onClick` to live in a client component. The parent
 * page (server component) imports this component and only passes
 * serialisable props.
 */

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

export function OutcomeCardCornerLink({
  href,
  ariaLabel,
}: {
  href: string
  ariaLabel: string
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-0 right-0 z-10 flex size-9 items-center justify-center border-l border-b border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <ArrowUpRight className="size-3.5" aria-hidden />
    </Link>
  )
}
