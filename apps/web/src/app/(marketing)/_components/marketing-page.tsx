import * as React from "react"

/**
 * Pass-through wrapper kept for the `/blocks` and `/components` route
 * sub-layouts, which historically wrapped their content in
 * `<MarketingPage>`. The decorative shared-border card + diagonal
 * stripes are now provided by `<GlobalLayout>` in
 * `apps/web/src/app/layout.tsx`, so this wrapper carries no visual
 * treatment of its own — it exists only as a stable import path
 * for those sub-layouts.
 *
 * If you find yourself adding styling here, you are re-introducing
 * the duplication that `<GlobalLayout>` was extracted to remove —
 * push the styling up to the root layout instead.
 */
export function MarketingPage({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
