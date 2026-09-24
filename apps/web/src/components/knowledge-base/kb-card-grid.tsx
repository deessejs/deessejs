import { cn } from "@workspace/ui/lib/utils"

/**
 * Responsive grid wrapper for KB cards.
 *
 * Border strategy (Pattern C from `.claude/skills/tailwind-borders`):
 * - Wrapper paints in `bg-border` (the border color).
 * - `gap-px` leaves a 1-px stripe of that bg between cells and along
 *   the wrapper's outer edges.
 * - Every cell paints in `bg-background` to cover the inner area.
 * - The wrapper also carries an explicit `border border-border` so the
 *   outer edge closes cleanly when the cell bg would otherwise bleed
 *   into the page background at the rounded corners (the cells inside
 *   are `rounded-none`, but the wrapper itself is not rounded — it
 *   sits inside a Recipe A card whose own border supplies the outer
 *   frame).
 *
 * Why Pattern C over `divide-x`/`divide-y`:
 *
 * `divide-*` is broken on multi-row grids (tailwindlabs/tailwindcss#13400):
 * on a 3-column grid with 8 cells, the final row of 2 cells gets no
 * right border on the rightmost cell because there is no sibling to
 * its right. With Pattern C the wrapper's own background fills the
 * 1-px gap, so every cell — including the last cell of an incomplete
 * row — closes its right edge cleanly. No `nth-child`, no
 * column-count arithmetic, no per-row drop rules.
 *
 * The previous `divide-x divide-y` implementation also added an
 * unwanted top border to non-last-children regardless of row, which
 * doubled the row separator at the first cell of every non-final row.
 * Pattern C has no such rule, so the top of the first row aligns to
 * the wrapper's border with no duplicate.
 *
 * Pattern C is documented in `.claude/skills/tailwind-borders` as
 * the right recipe for "grids needing both axes". It is what
 * `PostCardGrid` would converge to if Pattern B (negative margins
 * + overflow-hidden) were not already shipped.
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
        "m-0 grid list-none gap-px border border-border bg-border p-0 md:grid-cols-2 md:[&>li]:bg-background lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </ul>
  )
}
