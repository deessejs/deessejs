import Link from "next/link"

import { CategoryCardPreview } from "./category-card-preview"
import { getComponentIcon } from "./component-icon"
import type { ComponentCategory } from "./categories"
import type { CatalogueComponent } from "./components-list"

type Props = {
  categories: ReadonlyArray<ComponentCategory>
  /**
   * Map of `category.id` → its single component. Each category
   * has exactly one component in the new 1-category-per-component
   * taxonomy.
   */
  categoryToComponent: Record<ComponentCategory["id"], CatalogueComponent>
}

/**
 * Grid of category cards rendered on the `/components` index.
 *
 * Each card surfaces the component's preview at the top (a
 * 16:9 slot rendering the actual shadcn primitive), then a
 * meta block with the lucide icon, the category name, a
 * one-line description, and the component slug. Clicking any
 * card navigates to that category's page.
 *
 * Grid: shared-border recipe from `template-grid.tsx:32-39` —
 * 1/2/3/4 columns responsive, gap-0, nth-child selectors drop
 * trailing right and bottom borders so the grid reads as one
 * continuous table-like surface.
 */
export function CategoryGrid({ categories, categoryToComponent }: Props) {
  return (
    <ul className="grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 lg:grid-cols-3 [&>li]:border-r [&>li]:border-b [&>li]:border-border [&>li:nth-child(2n)]:md:border-r-0 [&>li:nth-child(3n)]:lg:border-r-0 [&>li:nth-child(4n)]:xl:border-r-0 [&>li:nth-last-child(-n+2)]:md:border-b-0 [&>li:nth-last-child(-n+3)]:lg:border-b-0 [&>li:nth-last-child(-n+4)]:xl:border-b-0">
      {categories.map((category) => {
        const component = categoryToComponent[category.id]
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
                {/* 16:9 preview slot — mirrors the catalogue card
                    recipe (CategoryCardPreview renders the actual
                    shadcn primitive in a bg-muted/40 surface). */}
                <CategoryCardPreview slug={component.slug} />
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
                  <span className="text-label-13 text-muted-foreground font-mono">
                    {component.slug}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}