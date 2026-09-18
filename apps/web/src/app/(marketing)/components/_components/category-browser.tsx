"use client"

import { useDeferredValue, useMemo, useState } from "react"

import { CatalogueGrid } from "./catalogue-grid"
import { CategoryNavSidebar } from "./category-nav-sidebar"
import { SearchInput } from "./search-input"
import type { CategoryId, ComponentCategory } from "./categories"
import type { CatalogueComponent } from "./components-list"

type Props = {
  components: ReadonlyArray<CatalogueComponent>
  categories: ReadonlyArray<ComponentCategory>
  pinnedCategory: CategoryId
}

/**
 * Client orchestrator for `/components/[category]`. Renders the
 * nav sidebar on the left and the grid of components in the
 * pinned category on the right. Search filters within the
 * category only — there is no checkbox filter at this level
 * (every component shown belongs to the pinned category).
 *
 * Layout classes match the index: 14rem sidebar + 1px column +
 * `divide-x divide-border`. Calque of `apps/web/src/app/(product)/templates/page.tsx:152`.
 */
export function CategoryBrowser({
  components,
  categories,
  pinnedCategory,
}: Props) {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase()

  const counts = useMemo(() => {
    const out = {} as Record<CategoryId, number>
    for (const category of categories) out[category.id] = 0
    for (const component of components) {
      out[component.category] = (out[component.category] ?? 0) + 1
    }
    return out
  }, [components, categories])

  const pinnedCategoryData = useMemo(
    () => categories.find((c) => c.id === pinnedCategory),
    [categories, pinnedCategory],
  )

  const filtered = useMemo(() => {
    if (!pinnedCategoryData) return []
    return components.filter((component) => {
      if (component.category !== pinnedCategory) return false
      if (normalizedQuery.length === 0) return true
      const haystack = `${component.name} ${component.description}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [components, pinnedCategory, pinnedCategoryData, normalizedQuery])

  return (
    <section
      aria-label={`${pinnedCategoryData?.name ?? "Category"} components`}
      className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_1px_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border"
    >
      <CategoryNavSidebar
        categories={categories}
        pinned={pinnedCategory}
        counts={counts}
      />
      {/* 1px divider column on desktop only — gap on mobile. */}
      <div aria-hidden className="hidden lg:block" />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={`Search ${pinnedCategoryData?.name.toLowerCase() ?? "components"}…`}
          aria-label={`Search components in ${pinnedCategoryData?.name ?? "this category"}`}
          className="max-w-sm"
        />
        {pinnedCategoryData && filtered.length > 0 ? (
          <CatalogueGrid
            groups={[
              {
                category: pinnedCategoryData,
                items: filtered,
              },
            ]}
          />
        ) : (
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-none border border-dashed border-border bg-muted/20 p-12 text-center"
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