"use client"

import { useCallback, useDeferredValue, useMemo, useState } from "react"

import { Button } from "@workspace/ui/components/button"

import { BlocksGrid } from "./blocks-grid"
import { BlocksSidebar } from "./blocks-sidebar"
import { SearchInput } from "@/app/(marketing)/components/_components/search-input"
import {
  BLOCK_CATEGORY_ORDER,
  type BlockCategoryId,
  type BlockCategory,
} from "./block-categories"
import type { CatalogueBlock } from "./blocks-list"

type Props = {
  blocks: ReadonlyArray<CatalogueBlock>
  categories: ReadonlyArray<BlockCategory>
}

/**
 * Client orchestrator for the `/blocks` index. Holds the
 * `Set<BlockCategoryId>` of active categories, groups the
 * catalogue by category, and renders `<BlocksSidebar>` +
 * `<BlocksGrid>` in the canonical two-column layout.
 *
 * Same shape as `CatalogueBrowser` in the components registry.
 * Default state = all categories active. Empty state shows a
 * centred card with a reset button when no category is selected.
 */
export function BlocksBrowser({ blocks, categories }: Props) {
  const [active, setActive] = useState<Set<BlockCategoryId>>(
    () => new Set(BLOCK_CATEGORY_ORDER),
  )
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase()

  const counts = useMemo(() => {
    const out = {} as Record<BlockCategoryId, number>
    for (const id of BLOCK_CATEGORY_ORDER) out[id] = 0
    for (const block of blocks) {
      out[block.category] = (out[block.category] ?? 0) + 1
    }
    return out
  }, [blocks])

  const grouped = useMemo(() => {
    const map = new Map<BlockCategoryId, CatalogueBlock[]>()
    for (const id of BLOCK_CATEGORY_ORDER) map.set(id, [])
    for (const block of blocks) {
      if (!active.has(block.category)) continue
      if (normalizedQuery.length > 0) {
        const haystack = `${block.name} ${block.description}`.toLowerCase()
        if (!haystack.includes(normalizedQuery)) continue
      }
      map.get(block.category)!.push(block)
    }
    return BLOCK_CATEGORY_ORDER.flatMap<BlockCategoryId, {
      category: BlockCategory
      items: CatalogueBlock[]
    }>((id) => {
      const items = map.get(id) ?? []
      if (items.length === 0) return []
      const category = categories.find((c) => c.id === id)
      if (!category) return []
      return [{ category, items }]
    })
  }, [blocks, categories, active, normalizedQuery])

  const toggle = useCallback((id: BlockCategoryId) => {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setActive(new Set(BLOCK_CATEGORY_ORDER))
  }, [])

  return (
    <section
      aria-label="Blocks catalogue"
      className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_1px_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border"
    >
      <BlocksSidebar
        categories={categories}
        active={active}
        counts={counts}
        onToggle={toggle}
        onReset={reset}
      />
      {/* 1px divider column on desktop only — gap on mobile (single column). */}
      <div aria-hidden className="hidden lg:block" />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search blocks…"
          aria-label="Search blocks by name or description"
          className="max-w-sm"
        />
        {grouped.length === 0 ? (
          <div
            role="status"
            aria-live="polite"
            data-testid="blocks-empty"
            className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center"
          >
            <p className="text-heading-24 tracking-tight text-foreground">
              No blocks match.
            </p>
            <p className="text-copy-14 text-muted-foreground max-w-sm">
              {active.size < categories.length
                ? "Pick at least one category in the sidebar, or clear the search."
                : "Try a different search term."}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              Show all categories
            </Button>
          </div>
        ) : (
          <BlocksGrid groups={grouped} />
        )}
      </div>
    </section>
  )
}