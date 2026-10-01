import { CatalogCard } from "@/components/catalog/catalog-card"
import type { ReactNode } from "react"

type ColumnCount = 3 | 4

type Props = {
  /**
   * Each entry is one card. Pass at minimum `href`, `ariaLabel`,
   * `preview`, `title`, `description`. The `footer` slot is used
   * by the blocks index to surface a slug chip below the
   * description.
   */
  entries: ReadonlyArray<{
    id: string
    href: string
    ariaLabel: string
    preview: ReactNode
    title: ReactNode
    description: ReactNode
    footer?: ReactNode
  }>
  /**
   * Number of columns at the largest breakpoint. The surface
   * settles on this layout:
   *   - 3: `grid-cols-3` at `lg:` (currently used by `/components`).
   *   - 4: `grid-cols-4` at `xl:` (currently used by `/blocks`).
   */
  columns: ColumnCount
}

/**
 * Catalog chrome: category grid.
 *
 * Renders one `<CatalogCard>` per category on the catalogue
 * index pages (`/<surface>`). Both `/components` and `/blocks`
 * use a 1-card-per-category layout — index pages, not drilldowns.
 *
 * Pre-refactor this was duplicated as
 * `component-grid.tsx` (3 columns) and
 * `blocks-category-grid.tsx` (4 columns). The two files differed
 * only in the column count and the optional `footer` chip — both
 * have been folded into this single component via the `columns`
 * prop and the per-entry `footer` slot.
 */
export function CatalogCategoryGrid({ entries, columns }: Props) {
  return (
    <ul
      className={[
        "grid list-none grid-cols-1 gap-0 p-0",
        // sm breakpoint: 2 columns on tablet
        "sm:grid-cols-2",
        // lg / xl breakpoint: surface-defined columns
        columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4",
        // shared-border recipe — nth-child selectors drop trailing
        // right and bottom borders so the grid reads as one
        // continuous table.
        "[&>li]:border-r [&>li]:border-b [&>li]:border-border",
        "[&>li:nth-child(2n)]:md:border-r-0",
        "[&>li:nth-child(3n)]:lg:border-r-0",
        columns === 4 ? "[&>li:nth-child(4n)]:xl:border-r-0" : null,
        "[&>li:nth-last-child(-n+2)]:md:border-b-0",
        "[&>li:nth-last-child(-n+3)]:lg:border-b-0",
        columns === 4 ? "[&>li:nth-last-child(-n+4)]:xl:border-b-0" : null,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {entries.map((entry) => (
        <li key={entry.id}>
          <CatalogCard
            href={entry.href}
            ariaLabel={entry.ariaLabel}
            preview={entry.preview}
            title={entry.title}
            description={entry.description}
            footer={entry.footer}
          />
        </li>
      ))}
    </ul>
  )
}
