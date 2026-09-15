import { BlocksCard } from "./blocks-card"
import type { CatalogueBlock } from "./blocks-list"
import type { BlockCategory } from "./block-categories"

type Props = {
  groups: ReadonlyArray<{
    category: BlockCategory
    items: ReadonlyArray<CatalogueBlock>
  }>
}

/**
 * Right column of the `/blocks` index. One `<section>` per
 * active category, each containing an `<h3>` with the count and a
 * 3-column grid of `<BlocksCard>`.
 *
 * Same shape as `CatalogueGrid` in the components registry.
 * Renders nothing when `groups` is empty — empty state lives one
 * level up in `<BlocksBrowser>`.
 */
export function BlocksGrid({ groups }: Props) {
  if (groups.length === 0) return null

  return (
    <div className="flex min-w-0 flex-1 flex-col divide-y divide-border [&>section]:py-6 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0">
      {groups.map(({ category, items }) => (
        <section
          key={category.id}
          id={`block-category-${category.id}`}
          aria-labelledby={`block-category-heading-${category.id}`}
          className="flex flex-col gap-4"
        >
          <header className="flex items-baseline justify-between gap-4">
            <h3
              id={`block-category-heading-${category.id}`}
              className="text-heading-24 tracking-tight text-foreground !m-0"
            >
              {category.name}
            </h3>
            <span className="text-label-13 text-muted-foreground">
              {items.length} block{items.length === 1 ? "" : "s"}
            </span>
          </header>
          <ul className="grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 lg:grid-cols-3 [&>li]:border-r [&>li]:border-b [&>li]:border-border [&>li:nth-child(2n)]:md:border-r-0 [&>li:nth-child(3n)]:lg:border-r-0 [&>li:nth-last-child(-n+2)]:md:border-b-0 [&>li:nth-last-child(-n+3)]:lg:border-b-0">
            {items.map((block) => (
              <BlocksCard key={block.slug} block={block} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}