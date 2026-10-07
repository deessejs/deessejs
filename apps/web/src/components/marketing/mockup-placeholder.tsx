import { DotGrid } from "./dot-grid"

/**
 * Generic mockup placeholder — used by sections that need a
 * visual anchor in a "right column" or "right side of a card"
 * without committing to a real illustration.
 *
 * Originally introduced on the homepage Surfaces and Ecosystem
 * tabs as a quiet texture (border + bg-muted/40 + the shared
 * dotted background). The contracts bento reuses the same
 * treatment so the right column of each cell stays in the
 * shared-border rhythm without leaning on a per-contract
 * custom mockup.
 *
 * The placeholder is `aria-hidden` because it carries no
 * information; the cell already has its title, description,
 * and provider list. `min-h-[80px]` keeps short cells
 * (Auth, Jobs) from collapsing to a flat sliver while
 * letting row-span-2 cells (Database) stretch naturally.
 *
 * The border + bg-muted/40 + DotGrid combo is the exact stack
 * used by SurfacesTabs and EcosystemTabs; reuse rather than
 * drift.
 */
export function MockupPlaceholder({
  className,
}: {
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={
        "relative min-h-[80px] overflow-hidden border border-border bg-muted/40" +
        (className ? ` ${className}` : "")
      }
    >
      <DotGrid className="absolute inset-0" />
    </div>
  )
}
