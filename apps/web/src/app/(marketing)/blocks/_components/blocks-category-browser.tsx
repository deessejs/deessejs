"use client"

import { useDeferredValue, useMemo, useState } from "react"

import { BlocksCategoryNavSidebar } from "./blocks-category-nav-sidebar"
import { BlocksGrid } from "./blocks-grid"
import { SearchInput } from "@/app/(marketing)/components/_components/search-input"
import type {
  BlockCategoryId,
  BlockCategory,
} from "./block-categories"
import type { CatalogueBlock } from "./blocks-list"

type Props = {
  blocks: ReadonlyArray<CatalogueBlock>
  categories: ReadonlyArray<BlockCategory>
  pinnedCategory: BlockCategoryId
}

/**
 * Client orchestrator for `/blocks/[category]`. Mirror of
 * `CategoryBrowser` in the components registry: nav sidebar +
 * grid of blocks in the pinned category, search filters within
 * the category.
 */
export function BlocksCategoryBrowser({
  blocks,
  categories,
  pinnedCategory,
}: Props) {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase()

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
      if (normalizedQuery.length === 0) return true
      const haystack = `${block.name} ${block.description}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [blocks, pinnedCategory, pinnedCategoryData, normalizedQuery])

  return (
    <section
      aria-label={`${pinnedCategoryData?.name ?? "Category"} blocks`}
      className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_1px_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border"
    >
      <BlocksCategoryNavSidebar
        categories={categories}
        pinned={pinnedCategory}
        counts={counts}
      />
      <div aria-hidden className="hidden lg:block" />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={`Search ${pinnedCategoryData?.name.toLowerCase() ?? "blocks"}…`}
          aria-label={`Search blocks in ${pinnedCategoryData?.name ?? "this category"}`}
          className="max-w-sm"
        />
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
            className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-none border border-dashed border-border bg-muted/20 p-12 text-center"
          >
            <p className="text-heading-24 tracking-tight text-foreground">
              No blocks match.
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