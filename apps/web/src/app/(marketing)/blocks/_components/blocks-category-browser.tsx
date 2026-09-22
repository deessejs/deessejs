"use client"

import { useDeferredValue, useMemo, useState } from "react"

import { BlocksCategoryNavSidebar } from "./blocks-category-nav-sidebar"
import { BlocksGrid } from "./blocks-grid"
import { SearchInput } from "@/app/(marketing)/components/_components/search-input"
import { TierSelect } from "@/app/(marketing)/components/_components/tier-select"
import type {
  BlockCategoryId,
  BlockCategory,
} from "./block-categories"
import type { CatalogueBlock } from "./blocks-list"
import type { TierFilter } from "@/app/(marketing)/components/_components/components-list"

type Props = {
  blocks: ReadonlyArray<CatalogueBlock>
  categories: ReadonlyArray<BlockCategory>
  pinnedCategory: BlockCategoryId
}

/**
 * Client orchestrator for `/blocks/[category]`. Mirror of
 * `CategoryBrowser` — search + tier filter in the right column,
 * pure nav sidebar on the left.
 */
export function BlocksCategoryBrowser({
  blocks,
  categories,
  pinnedCategory,
}: Props) {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase()
  const [tier, setTier] = useState<TierFilter>("all")

  const counts = useMemo(() => {
    const out = {} as Record<BlockCategoryId, number>
    for (const category of categories) out[category.id] = 0
    for (const block of blocks) {
      out[block.category] = (out[block.category] ?? 0) + 1
    }
    return out
  }, [blocks, categories])

  const pinnedCategoryData = useMemo(
    () => categories.find((c) => c.id === pinnedCategory),
    [categories, pinnedCategory],
  )

  const filtered = useMemo(() => {
    if (!pinnedCategoryData) return []
    return blocks.filter((block) => {
      if (block.category !== pinnedCategory) return false
      // Search
      if (normalizedQuery.length > 0) {
        const haystack = `${block.name} ${block.description}`.toLowerCase()
        if (!haystack.includes(normalizedQuery)) return false
      }
      // Tier
      if (tier !== "all" && block.tier !== tier) return false
      return true
    })
  }, [blocks, pinnedCategory, pinnedCategoryData, normalizedQuery, tier])

  return (
    <section
      aria-label={`${pinnedCategoryData?.name ?? "Category"} blocks`}
      className="grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border"
    >
      <BlocksCategoryNavSidebar
        categories={categories}
        pinned={pinnedCategory}
        counts={counts}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Search + tier filter — sit inside the right column, above the grid */}
        <div className="flex flex-col items-stretch gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={`Search ${pinnedCategoryData?.name.toLowerCase() ?? "blocks"}…`}
            aria-label={`Search blocks in ${pinnedCategoryData?.name ?? "this category"}`}
            className="flex-1 sm:max-w-sm"
          />
          <TierSelect value={tier} onChange={setTier} />
        </div>
        {pinnedCategoryData && filtered.length > 0 ? (
          <BlocksGrid
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
            className="flex min-h-64 flex-col items-center justify-center gap-4 border border-dashed border-border bg-muted/20 p-12 text-center"
          >
            <p className="text-heading-24 tracking-tight text-foreground">
              No blocks match.
            </p>
            <p className="text-copy-14 text-muted-foreground max-w-sm">
              Try a different search term or tier.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}