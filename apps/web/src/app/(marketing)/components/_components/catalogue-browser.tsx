"use client"

import { useMemo } from "react"

import { CategoryGrid } from "./category-grid"
import { CatalogueSidebar } from "./catalogue-sidebar"
import type { CategoryId, ComponentCategory } from "./categories"
import type { CatalogueComponent } from "./components-list"

type Props = {
  categories: ReadonlyArray<ComponentCategory>
  /**
   * Map of `category.id` → its single component. Each category
   * has exactly one component in the V1 1-category-per-component
   * taxonomy. The grid shows one card per category.
   */
  categoryToComponent: Record<CategoryId, CatalogueComponent>
}

/**
 * Client orchestrator for the `/components` index.
 *
 * Two-column layout:
 *   - Left: nav sidebar with one `<Link>` per category, plus a
 *     count badge per row. Pure navigation, no checkboxes.
 *   - Right: grid of category cards directly. No search, no
 *     filter — 24 items is small enough that the nav sidebar
 *     alone is the right affordance.
 *
 * Layout: 18rem sidebar + 1px column + `divide-x divide-border`.
 * The tier filter lives on the drilldown (`/components/[category]`).
 */
export function CatalogueBrowser({ categories, categoryToComponent }: Props) {
  const counts = useMemo(() => {
    const out = {} as Record<CategoryId, number>
    for (const id in categoryToComponent) {
      out[id as CategoryId] = 1
    }
    return out
  }, [categoryToComponent])

  return (
    <section
      aria-label="Components catalogue"
      className="grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border"
    >
      <CatalogueSidebar categories={categories} counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <CategoryGrid
          categories={categories}
          categoryToComponent={categoryToComponent}
        />
      </div>
    </section>
  )
}