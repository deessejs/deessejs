import Link from "next/link"

import { ComponentCardPreview } from "./component-card-preview"
import { getComponentIcon } from "./component-icon"
import type { ComponentCategory } from "./categories"
import type { CatalogueComponent } from "./components-list"

type Props = {
  categories: ReadonlyArray<ComponentCategory>
  /**
   * Map of category.id → the first component in that category.
   * Drives the card preview (icon + content) — V2 has 5
   * components per category, all linked from the per-category
   * page. The index page renders 3 cards (one per category).
   */
  componentByCategory: Record<ComponentCategory["id"], CatalogueComponent>
}

/**
 * Right column of the `/components` index. Renders one card per
 * category (3 cards in V2: Buttons, Inputs, Badges). Clicking
 * a card navigates to that category's drilldown page where the
 * 5 components live.
 */
export function ComponentGrid({ categories, componentByCategory }: Props) {
  return (
    <ul className="grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 lg:grid-cols-3 [&>li]:border-r [&>li]:border-b [&>li]:border-border [&>li:nth-child(2n)]:md:border-r-0 [&>li:nth-child(3n)]:lg:border-r-0 [&>li:nth-last-child(-n+2)]:md:border-b-0 [&>li:nth-last-child(-n+3)]:lg:border-b-0">
      {categories.map((category) => {
        const component = componentByCategory[category.id]
        if (!component) return null
        const Icon = getComponentIcon(component.slug)
        const href = `/components/${category.slug}`
        return (
          <li key={category.id}>
            <Link
              href={href}
              aria-label={`Browse the ${category.name} category`}
              className="group flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex h-full flex-col bg-background transition-colors group-hover:bg-accent/30">
                <ComponentCardPreview slug={component.slug} />
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="flex items-start gap-3">
                    <Icon
                      aria-hidden
                      className="text-muted-foreground mt-0.5 size-4 shrink-0"
                    />
                    <h2 className="text-label-16 leading-snug font-semibold tracking-tight text-balance">
                      {category.name}
                    </h2>
                  </div>
                  <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
                    {category.description}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}