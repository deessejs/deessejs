import { CatalogueCard } from "./catalogue-card"
import type { CatalogueComponent } from "./components-list"
import type { ComponentCategory } from "./categories"

type Props = {
  groups: ReadonlyArray<{
    category: ComponentCategory
    items: ReadonlyArray<CatalogueComponent>
  }>
}

/**
 * Right column of the `/components` index. One `<section>` per
 * active category, each containing a `<h3>` with the count and a
 * 3-column grid of `<CatalogueCard>`.
 *
 * Renders nothing when `groups` is empty (the empty state lives
 * one level up in `<CatalogueBrowser>`).
 */
export function CatalogueGrid({ groups }: Props) {
  if (groups.length === 0) return null

  return (
    <div className="flex min-w-0 flex-1 flex-col divide-y divide-border [&>section]:py-6 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0">
      {groups.map(({ category, items }) => (
        <section
          key={category.id}
          id={`category-${category.id}`}
          aria-labelledby={`category-heading-${category.id}`}
          className="flex flex-col gap-4"
        >
          <header className="flex items-baseline justify-between">
            <h3
              id={`category-heading-${category.id}`}
              className="text-heading-24 tracking-tight text-foreground !m-0"
            >
              {category.name}
            </h3>
            <span className="text-label-13 text-muted-foreground">
              {items.length} component{items.length === 1 ? "" : "s"}
            </span>
          </header>
          <ul className="grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 lg:grid-cols-3 [&>li]:border-r [&>li]:border-b [&>li]:border-border [&>li:nth-child(2n)]:md:border-r-0 [&>li:nth-child(3n)]:lg:border-r-0 [&>li:nth-last-child(-n+2)]:md:border-b-0 [&>li:nth-last-child(-n+3)]:lg:border-b-0">
            {items.map((component) => (
              <CatalogueCard key={component.slug} component={component} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}