"use client"

import { useDeferredValue, useMemo, useState } from "react"

import { CategoryGrid } from "./category-grid"
import { CatalogueSidebar } from "./catalogue-sidebar"
import { SearchInput } from "./search-input"
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
 *   - Right: search above, then a grid of category cards. Each
 *     card links to its category page where the preview/code
 *     surface lives.
 *
 * Layout: 18rem sidebar + 1px column + `divide-x divide-border`.
 * The tier filter lives on the drilldown (`/components/[category]`),
 * not on the index — the index doesn't know how many of each tier
 * each category contains.
 */
export function CatalogueBrowser({ categories, categoryToComponent }: Props) {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase()

  const counts = useMemo(() => {
    const out = {} as Record<CategoryId, number>
    for (const id in categoryToComponent) {
      out[id as CategoryId] = 1
    }
    return out
  }, [categoryToComponent])

  const filtered = useMemo(() => {
    if (normalizedQuery.length === 0) return categories
    return categories.filter((category) => {
      const haystack = `${category.name} ${category.description}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [categories, normalizedQuery])

  return (
    <section
      aria-label="Components catalogue"
      className="grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border"
    >
      <CatalogueSidebar categories={categories} counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Search — sits inside the right column, above the grid */}
        <div className="border-b border-border p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search categories…"
            aria-label="Search categories by name or description"
          />
        </div>
        {filtered.length === 0 ? (
          <div
            role="status"
            aria-live="polite"
            data-testid="components-empty"
            className="flex min-h-64 flex-col items-center justify-center gap-4 border border-dashed border-border bg-muted/20 p-12 text-center"
          >
            <p className="text-heading-24 tracking-tight text-foreground">
              No categories match.
            </p>
            <p className="text-copy-14 text-muted-foreground max-w-sm">
              Try a different search term.
            </p>
          </div>
        ) : (
          <CategoryGrid
            categories={filtered}
            categoryToComponent={categoryToComponent}
          />
        )}
      </div>
    </section>
  )
}