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
 * - Dividers use Tailwind's native `divide-x` / `divide-y`
 *   utilities, which add `border-r` / `border-b` to every cell via
 *   sibling selectors (`> :not(:last-child)` for `divide-x`,
 *   `> :not(:last-child)` row-equivalent for `divide-y`). Adjacent
 *   cards therefore share a single border automatically, with no
 *   per-row nth-child math to maintain.
 *
 * The previous implementation used `[&>li]:border-r [&>li]:border-b`
 * plus four nth-child rules to drop the trailing edges. That worked
 * but was fragile: a row with fewer cells than the column count
 * left its last cell with a stray `border-b` that doubled the
 * wrapper's own border. `divide-x` / `divide-y` handle every
 * layout shape correctly with one declaration.
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
        "m-0 list-none grid grid-cols-1 divide-y divide-border divide-x p-0 md:grid-cols-2 lg:grid-cols-3",
        "[&>li]:block",
        className,
      )}
    >
      {children}
    </ul>
  )
}
