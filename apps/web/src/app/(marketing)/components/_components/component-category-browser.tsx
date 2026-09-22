"use client"

import { useDeferredValue, useMemo, useState } from "react"

import { ComponentCategoryNavSidebar } from "./component-category-nav-sidebar"
import { ComponentListGrid } from "./component-list-grid"
import { SearchInput } from "@/app/(marketing)/components/_components/search-input"
import type { ComponentCategory } from "./categories"
import type { CatalogueComponent } from "./components-list"

type Props = {
  components: ReadonlyArray<CatalogueComponent>
  category: ComponentCategory
}

/**
 * Client orchestrator for `/components/[category]`. Mirror of
 * `BlocksCategoryBrowser`.
 *
 * Two-column layout:
 *   - Left: nav sidebar listing every component in the category.
 *     Pure navigation.
 *   - Right: search above, then a grid of `ComponentCard` (one
 *     card per component in the category).
 *
 * Layout: 18rem sidebar + 1px column + `divide-x divide-border`.
 */
export function ComponentCategoryBrowser({ components, category }: Props) {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (normalizedQuery.length === 0) return components
    return components.filter((component) => {
      const haystack = `${component.name} ${component.description}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [components, normalizedQuery])

  return (
    <section
      aria-label={`${category.name} components`}
      className="grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border"
    >
      <ComponentCategoryNavSidebar components={components} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Search — sits inside the right column, above the grid */}
        <div className="border-b border-border p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={`Search ${category.name.toLowerCase()}…`}
            aria-label={`Search components in ${category.name}`}
          />
        </div>
        {filtered.length > 0 ? (
          <ComponentListGrid components={filtered} />
        ) : (
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-64 flex-col items-center justify-center gap-4 border border-dashed border-border bg-muted/20 p-12 text-center"
          >
            <p className="text-heading-24 tracking-tight text-foreground">
              No components match.
            </p>
            <p className="text-copy-14 text-muted-foreground max-w-sm">
              Try a different search term.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}