import { cn } from "@workspace/ui/lib/utils"

/**
 * Responsive grid wrapper for KB cards.
 *
 * Layout:
 * - `gap-0` so adjacent cards share a single border, no double-rule.
 * - `bg-background` and `rounded-none` (set on the Card itself) so
 *   the grid reads as one continuous table-like surface rather than
 *   a stack of floating tiles.
 * - Dividers use Tailwind's native `divide-x` / `divide-y`
 *   utilities, which add `border-r` / `border-b` to every cell via
 *   `:not(:last-child)` sibling selectors. Adjacent cards therefore
 *   share a single border automatically, with no per-row
 *   nth-child math to maintain.
 *
 * Known limitation — multi-row grids with a short final row:
 *
 * `divide-y` on a multi-row grid adds a top border to every
 * non-last-child, regardless of which row it lands in. With a
 * final row shorter than the column count (e.g. 8 topics on a
 * 3-column grid → last row has 2 cells), the first cell of the
 * final row gets an unwanted top border that doubles the
 * previous row's `border-b`. This is `tailwindlabs/tailwindcss#13400`.
 *
 * With the current 8 topics the bug is mild (one extra pixel
 * rule on one cell), but it gets worse as topics are added.
 * Migrating to Pattern B (`-mr-px -mb-px` + outer
 * `overflow-hidden rounded-xl border`) would fix it at the cost
 * of requiring the caller to wrap the grid in a border container.
 * The migration also affects `TemplateGrid` and would close the
 * loop with `PostCardGrid` — out of scope here. Documented so
 * the next maintainer doesn't trust the "every layout shape
 * correctly" claim.
 *
 * The previous implementation used `[&>li]:border-r [&>li]:border-b`
 * plus four nth-child rules to drop the trailing edges. That worked
 * but was fragile in the same way: a row with fewer cells than the
 * column count left its last cell with a stray `border-b` that
 * doubled the wrapper's own border. `divide-x` / `divide-y`
 * transfer the fragility from "drops the wrong cell" to "adds a
 * border where it shouldn't" — same general problem, different
 * specific failure mode.
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
