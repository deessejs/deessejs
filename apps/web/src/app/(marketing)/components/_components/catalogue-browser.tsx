"use client"

import { useCallback, useDeferredValue, useMemo, useState } from "react"

import { Button } from "@workspace/ui/components/button"

import { CatalogueGrid } from "./catalogue-grid"
import { CatalogueSidebar } from "./catalogue-sidebar"
import { SearchInput } from "./search-input"
import {
  CATEGORY_ORDER,
  type CategoryId,
  type ComponentCategory,
} from "./categories"
import type { CatalogueComponent } from "./components-list"

type Props = {
  components: ReadonlyArray<CatalogueComponent>
  categories: ReadonlyArray<ComponentCategory>
}

/**
 * Client orchestrator for the `/components` index. Holds the
 * `Set<CategoryId>` of active categories, groups the catalogue by
 * category, and renders `<CatalogueSidebar>` + `<CatalogueGrid>` in
 * the canonical two-column layout.
 *
 * Layout classes match `apps/web/src/app/(product)/templates/page.tsx:152`:
 * `grid grid-cols-1 gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12`.
 *
 * Default state = all categories active. Empty state (no category
 * selected) shows a centred card with a "Show all categories"
 * reset button.
 */
export function CatalogueBrowser({ components, categories }: Props) {
  const [active, setActive] = useState<Set<CategoryId>>(
    () => new Set(CATEGORY_ORDER),
  )
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase()

  const counts = useMemo(() => {
    const out = {} as Record<CategoryId, number>
    for (const id of CATEGORY_ORDER) out[id] = 0
    for (const component of components) {
      out[component.category] = (out[component.category] ?? 0) + 1
    }
    return out
  }, [components])

  const grouped = useMemo(() => {
    const map = new Map<CategoryId, CatalogueComponent[]>()
    for (const id of CATEGORY_ORDER) map.set(id, [])
    for (const component of components) {
      if (!active.has(component.category)) continue
      if (normalizedQuery.length > 0) {
        const haystack = `${component.name} ${component.description}`.toLowerCase()
        if (!haystack.includes(normalizedQuery)) continue
      }
      map.get(component.category)!.push(component)
    }
    return CATEGORY_ORDER.flatMap<CategoryId, {
      category: ComponentCategory
      items: CatalogueComponent[]
    }>((id) => {
      const items = map.get(id) ?? []
      if (items.length === 0) return []
      const category = categories.find((c) => c.id === id)
      if (!category) return []
      return [{ category, items }]
    })
  }, [components, categories, active, normalizedQuery])

  const toggle = useCallback((id: CategoryId) => {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setActive(new Set(CATEGORY_ORDER))
  }, [])

  return (
    <section
      aria-label="Components catalogue"
      className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_1px_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border"
    >
      <CatalogueSidebar
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
          placeholder="Search components…"
          aria-label="Search components by name or description"
          className="max-w-sm"
        />
        {grouped.length === 0 ? (
          <div
            role="status"
            aria-live="polite"
            data-testid="components-empty"
            className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center"
          >
            <p className="text-heading-24 tracking-tight text-foreground">
              No components match.
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
          <CatalogueGrid groups={grouped} />
        )}
      </div>
    </section>
  )
}