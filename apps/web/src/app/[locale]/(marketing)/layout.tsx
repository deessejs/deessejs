import type { ReactNode } from "react"

/**
 * Layout for the entire `(marketing)` route group.
 *
 * The decorative diagonal-stripe columns are rendered by
 * `<MarketingPage>` itself (so they sit flush against the page's
 * shared-border card, not at the viewport edges). This layout exists
 * as a stable wrapper to scope future cross-page concerns without
 * touching the root `layout.tsx`.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
