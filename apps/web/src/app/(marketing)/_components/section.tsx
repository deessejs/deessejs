import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Wrapper for one section of the shared-border MarketingPage layout.
 *
 * Every section on `/` lives inside a `border-b border-border` divider
 * so cells share borders with the page's outer card. The divider is
 * inherited from the last row of the previous section (or the wrapper
 * outline for the first section). Wrapping each section in a single
 * `<Section>` removes the per-section className boilerplate and makes
 * the page file read like a list of sections.
 *
 * The component does NOT impose a grid — many sections are simple
 * stacked rows. For grids, compose with Tailwind classes via `className`.
 */
export function Section({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("border-b border-border", className)}>{children}</div>
  )
}
