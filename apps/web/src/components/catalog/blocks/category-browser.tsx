"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { createElement } from "react"
import { Wrench } from "lucide-react"

import { CatalogCard } from "@/components/catalog/catalog-card"
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state"
import { CatalogSidebar } from "@/components/catalog/catalog-sidebar"
import { SearchInput } from "@/components/catalog/shared/search-input"
import { BLOCK_ICONS } from "@/components/catalog/blocks/icons"
import { BlockCardPreview } from "@/components/catalog/blocks/card-preview"
import type { BlockCategory } from "@/components/catalog/blocks/categories"
import type { CatalogueBlock } from "@/components/catalog/blocks/catalogue"

type Props = {
  blocks: ReadonlyArray<CatalogueBlock>
  categories: ReadonlyArray<BlockCategory>
  pinnedCategory: BlockCategory["id"]
}

/**
 * Client-side category browser for `/blocks/[category]`.
 *
 * Owns the search-with-debounce state, the per-category count
 * calculation, and the two-column layout (sidebar + grid).
 *
 * Pre-refactor: this lived in
 * `apps/web/src/app/(product)/blocks/_components/blocks-category-browser.tsx`
 * — moved here to remove the per-surface `_components/`
 * directory.
 */

// Module-level icon map. Looked up by slug and rendered via
// `createElement` to satisfy the react-hooks/static-components
// rule (a `const Icon = ...` inside the render body would
// trigger it). Cast widens the `as const satisfies Record<...>`
// exact type to a plain indexable map.
const ICON_BY_SLUG = BLOCK_ICONS as unknown as Record<
  string,
  React.ComponentType<{ "aria-hidden"?: boolean; className?: string }>
>

export function BlocksCategoryBrowserClient({
  blocks,
  categories,
  pinnedCategory,
}: Props) {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase()

  const counts = useMemo(() => {
    const out = {} as Record<BlockCategory["id"], number>
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
      if (normalizedQuery.length > 0) {
        const haystack = `${block.name} ${block.description}`.toLowerCase()
        if (!haystack.includes(normalizedQuery)) return false
      }
      return true
    })
  }, [blocks, pinnedCategory, pinnedCategoryData, normalizedQuery])

  if (!pinnedCategoryData) return null

  return (
    <section
      aria-label={`${pinnedCategoryData.name} blocks`}
      className="grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border"
    >
      <CatalogSidebar
        heading="Blocks"
        basePath="/blocks"
        entries={categories}
        pinned={pinnedCategory}
        counts={counts}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Search — sits inside the right column, above the grid */}
        <div className="flex flex-col items-stretch gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={`Search ${pinnedCategoryData.name.toLowerCase()}…`}
            aria-label={`Search blocks in ${pinnedCategoryData.name}`}
            className="flex-1 sm:max-w-sm"
          />
        </div>
        {filtered.length > 0 ? (
          <ul className="grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 lg:grid-cols-3 [&>li]:border-r [&>li]:border-b [&>li]:border-border [&>li:nth-child(2n)]:md:border-r-0 [&>li:nth-child(3n)]:lg:border-r-0 [&>li:nth-last-child(-n+2)]:md:border-b-0 [&>li:nth-last-child(-n+3)]:lg:border-b-0">
            {filtered.map((block) => (
              <li key={block.slug}>
                <CatalogCard
                  href={`/blocks/${block.category}/${block.slug}`}
                  ariaLabel={`Read the ${block.name} block`}
                  preview={<BlockCardPreview block={block} />}
                  title={
                    <div className="flex items-start gap-3">
                      {createElement(ICON_BY_SLUG[block.slug] ?? Wrench, {
                        "aria-hidden": true,
                        className:
                          "text-muted-foreground mt-0.5 size-4 shrink-0",
                      })}
                      <span>{block.name}</span>
                    </div>
                  }
                  description={block.description}
                />
              </li>
            ))}
          </ul>
        ) : (
          <CatalogEmptyState
            title="No blocks match."
            description="Try a different search term."
          />
        )}
      </div>
    </section>
  )
}
