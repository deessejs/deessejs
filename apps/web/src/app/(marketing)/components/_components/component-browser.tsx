"use client"

import { useMemo } from "react"

import { ComponentGrid } from "./component-grid"
import { ComponentListSidebar } from "./component-list-sidebar"
import type { CategoryId, ComponentCategory } from "./categories"
import type { CatalogueComponent } from "./components-list"

type Props = {
  categories: ReadonlyArray<ComponentCategory>
  /**
   * Map of category.id → first component in that category.
   * Drives the index card preview (3 cards in V2). The sidebar
   * shows the count of components per category.
   */
  componentByCategory: Record<CategoryId, CatalogueComponent>
  /** Map of category.id → count (number of components in that category). */
  counts: Record<CategoryId, number>
}

/**
 * Client orchestrator for the `/components` index.
 *
 * Two-column layout:
 *   - Left: nav sidebar with one `<Link>` per category, plus a
 *     count badge per row. Pure navigation, no checkboxes.
 *   - Right: grid of 3 category cards. No search, no tier
 *     filter (V2 ships every component as `free`).
 *
 * Layout: 18rem sidebar + 1px column + `divide-x divide-border`.
 */
export function ComponentBrowser({
  categories,
  componentByCategory,
  counts,
}: Props) {
  return (
    <section
      aria-label="Components catalogue"
      className="grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border"
    >
      <ComponentListSidebar categories={categories} counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <ComponentGrid
          categories={categories}
          componentByCategory={componentByCategory}
        />
      </div>
    </section>
  )
}