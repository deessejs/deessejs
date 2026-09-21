import * as React from "react"

/**
 * Page-level wrapper for every page in the `(marketing)` route group.
 *
 * Provides a uniform outer container (padding + responsive widths via
 * the `container` utility) and a shared-border card outline that frames
 * the page content the same way on every marketing surface. On viewports
 * ≥ 2xl, two thin diagonal-stripe columns are rendered flush against
 * the inner shared-border card to give the page a subtle "annotated"
 * feel (left/right of the card, not at the viewport edges).
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
export function MarketingPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto container px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="relative border border-border bg-background rounded-none">
        {children}
        {/* Left diagonal stripe column — flush against the inner card's
            left edge, sitting on the border itself. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-0 hidden w-10 -translate-x-full border-y border-l border-border bg-[repeating-linear-gradient(315deg,var(--border)_0,var(--border)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px] xl:block"
        />
        {/* Right diagonal stripe column — flush against the inner card's
            right edge. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-10 translate-x-full border-y border-r border-border bg-[repeating-linear-gradient(315deg,var(--border)_0,var(--border)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px] xl:block"
        />
      </div>
    </div>
  )
}

