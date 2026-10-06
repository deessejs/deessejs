import type { ReactNode } from "react"

type Props = {
  /** Aria label for the wrapping `<section>`. */
  ariaLabel: string
  /**
   * Whether to add a trailing `border-b` on the section. The
   * components index kept the border; the blocks index dropped
   * it. Defaults to false to match the more conservative side
   * (blocks).
   */
  withBottomBorder?: boolean
  /** Sidebar slot. */
  sidebar: ReactNode
  /** Right column slot — the grid, list, or whatever the surface renders. */
  children: ReactNode
}

/**
 * Catalog chrome: index browser shell.
 *
 * Two-column layout that wraps every `/<surface>` index page:
 *   - Left: nav sidebar (the caller provides a `<CatalogSidebar>`).
 *   - Right: grid / list (the caller provides the content).
 *
 * Layout: 1 column (gap-8) on mobile, `18rem` sidebar + 1px
 * column with `divide-x divide-border` from `lg:` onwards.
 *
 * Pre-refactor: this wrapping `<section>` was duplicated as
 * `component-browser.tsx` (with bottom border) and
 * `blocks-browser.tsx` (without). Both have been reduced to
 * thin orchestrators that import this shell and pass in the
 * surface-specific sidebar / grid.
 */
export function CatalogBrowserShell({
  ariaLabel,
  withBottomBorder = false,
  sidebar,
  children,
}: Props) {
  return (
    <section
      aria-label={ariaLabel}
      className={`grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border${
        withBottomBorder ? " border-b" : ""
      }`}
    >
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </section>
  )
}
