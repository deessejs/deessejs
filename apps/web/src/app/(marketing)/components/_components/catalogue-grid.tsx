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
    <div className="flex min-w-0 flex-1 flex-col gap-12">
      {groups.map(({ category, items }) => (
        <section
          key={category.id}
          id={`category-${category.id}`}
          aria-labelledby={`category-heading-${category.id}`}
          className="flex flex-col gap-4"
        >
          <header className="flex items-baseline justify-between gap-4">
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
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((component) => (
              <CatalogueCard key={component.slug} component={component} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}