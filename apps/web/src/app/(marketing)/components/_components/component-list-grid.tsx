import { ComponentCard } from "./component-card"
import type { CatalogueComponent } from "./components-list"

type Props = {
  components: ReadonlyArray<CatalogueComponent>
}

/**
 * Grid of component cards for the per-category page
 * `/components/[category]`. Renders one `<ComponentCard>` per
 * component, each linked to its own leaf page.
 *
 * Same shared-border recipe as the index grid (gap-0,
 * nth-child selectors drop trailing right and bottom borders).
 */
export function ComponentListGrid({ components }: Props) {
  return (
    <ul className="grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 lg:grid-cols-3 [&>li]:border-r [&>li]:border-b [&>li]:border-border [&>li:nth-child(2n)]:md:border-r-0 [&>li:nth-child(3n)]:lg:border-r-0 [&>li:nth-last-child(-n+2)]:md:border-b-0 [&>li:nth-last-child(-n+3)]:lg:border-b-0">
      {components.map((component) => (
        <li key={component.slug}>
          <ComponentCard component={component} />
        </li>
      ))}
    </ul>
  )
}