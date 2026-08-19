import { cn } from "@workspace/ui/lib/utils"

/**
 * Responsive grid wrapper for KB cards.
 *
 * Mirrors the templates grid pattern (`components/templates/
 * template-grid.tsx`):
 * - `gap-0` so adjacent cards share a single border, no double-rule.
 * - `bg-background` and `rounded-none` (set on the Card itself) so
 *   the grid reads as one continuous table-like surface rather than
 *   a stack of floating tiles.
 * - Dividers are drawn on the Link wrapper (`[&>li>*]`), not on
 *   the `<li>` itself. The Link is `display: flex` and fills the
 *   grid cell, so its borders align with the grid lines. The Card
 *   inside the Link has `border-0` and inherits the visual edge.
 * - The last card in each row drops its right border via
 *   `:nth-child(3n)`:border-r-0; the last row drops its bottom
 *   border via `:nth-last-child(-n+3)`:border-b-0. This avoids
 *   Tailwind's known `divide-*` issue (tailwindlabs/tailwindcss#18265)
 *   on grid containers, and stays portable across all browsers
 *   without depending on `row-rule` / `column-rule` (CSS Gap
 *   Decorations — not Baseline yet).
 */
export function KbCardGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string | undefined
}) {
  return (
    <ul
      className={cn(
        "m-0 list-none grid grid-cols-1 p-0 md:grid-cols-2 lg:grid-cols-3",
        "[&>li]:block [&>li]:border-r [&>li]:border-b [&>li]:border-border",
        "[&>li:nth-child(2n)]:md:border-r-0",
        "[&>li:nth-child(3n)]:lg:border-r-0",
        "[&>li:nth-last-child(-n+2)]:md:border-b-0",
        "[&>li:nth-last-child(-n+3)]:lg:border-b-0",
        className,
      )}
    >
      {children}
    </ul>
  )
}