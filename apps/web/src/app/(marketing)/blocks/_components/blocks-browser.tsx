"use client"

import { useMemo } from "react"

import { BlocksCategoryGrid } from "./blocks-category-grid"
import { BlocksSidebar } from "./blocks-sidebar"
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
 *   - Right: grid of category cards directly. No search, no
 *     filter — 8 items is small enough that the nav sidebar
 *     alone is the right affordance.
 *
 * Layout: 18rem sidebar + 1px column + `divide-x divide-border`.
 * The tier filter lives on the drilldown (`/blocks/[category]`).
 */
export function BlocksBrowser({ categories, categoryToBlock }: Props) {
  const counts = useMemo(() => {
    const out = {} as Record<BlockCategoryId, number>
    for (const id in categoryToBlock) {
      out[id as BlockCategoryId] = 1
    }
    return out
  }, [categoryToBlock])

  return (
    <section
      aria-label="Blocks catalogue"
      className="grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border"
    >
      <BlocksSidebar categories={categories} counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <BlocksCategoryGrid
          categories={categories}
          categoryToBlock={categoryToBlock}
        />
      </div>
    </section>
  )
}