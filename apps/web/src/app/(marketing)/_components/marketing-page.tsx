import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Page-level wrapper for every page in the `(marketing)` route group.
 *
 * Provides a uniform outer container (padding + responsive widths via
 * the `container` utility) and a shared-border card outline that frames
 * the page content the same way on every marketing surface.
 *
 * Pages should render their top-level content directly as children; no
 * additional `<article>` or `<div>` wrapper is needed.
 *
 * @example
 *   <MarketingPage>
 *     <h1>...</h1>
 *     <p>...</p>
 *   </MarketingPage>
 */
export function MarketingPage({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
<div className="mx-auto container px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
  <div className="border border-border bg-background rounded-none">
    {children}
  </div>
</div>

  )
}
