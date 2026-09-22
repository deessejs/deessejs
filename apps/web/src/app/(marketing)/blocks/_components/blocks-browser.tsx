"use client"

import { useDeferredValue, useMemo, useState } from "react"

import { BlocksCategoryGrid } from "./blocks-category-grid"
import { BlocksSidebar } from "./blocks-sidebar"
import { SearchInput } from "@/app/(marketing)/components/_components/search-input"
import type {
  BlockCategoryId,
  BlockCategory,
} from "./block-categories"
import type { CatalogueBlock } from "./blocks-list"

type Props = {
  categories: ReadonlyArray<BlockCategory>
  /**
   * Map of `category.id` → a representative block. The grid
   * shows one card per category. Each category has multiple
   * blocks in V1 (not the new 1-category-per-component
   * taxonomy — block categories are functional groupings of
   * sections of a page).
   */
  categoryToBlock: Record<BlockCategoryId, CatalogueBlock>
}

/**
 * Client orchestrator for the `/blocks` index.
 *
 * Two-column layout:
 *   - Left: nav sidebar with one `<Link>` per category, plus a
 *     count badge per row. Pure navigation, no checkboxes.
 *   - Right: search above, then a grid of category cards.
 *     Clicking any card navigates to that category's page.
 *
 * Layout: 18rem sidebar + 1px column + `divide-x divide-border`.
 * The tier filter lives on the drilldown (`/blocks/[category]`),
 * not on the index.
 */
export function BlocksBrowser({ categories, categoryToBlock }: Props) {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase()

  const counts = useMemo(() => {
    const out = {} as Record<BlockCategoryId, number>
    for (const id in categoryToBlock) {
      out[id as BlockCategoryId] = 1
    }
    return out
  }, [categoryToBlock])

  const filtered = useMemo(() => {
    if (normalizedQuery.length === 0) return categories
    return categories.filter((category) => {
      const haystack = `${category.name} ${category.description}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [categories, normalizedQuery])

  return (
    <section
      aria-label="Blocks catalogue"
      className="grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border"
    >
      <BlocksSidebar categories={categories} counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Search — sits inside the right column, above the grid */}
        <div className="border-b border-border p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search categories…"
            aria-label="Search block categories by name or description"
          />
        </div>
        {filtered.length === 0 ? (
          <div
            role="status"
            aria-live="polite"
            data-testid="blocks-empty"
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
          <BlocksCategoryGrid
            categories={filtered}
            categoryToBlock={categoryToBlock}
          />
        )}
      </div>
    </section>
  )
}