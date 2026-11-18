"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { createElement } from "react"
import { Wrench } from "lucide-react"

import { CatalogCard } from "@/components/catalog/catalog-card"
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state"
import { CatalogSidebar } from "@/components/catalog/catalog-sidebar"
import { SearchInput } from "@/components/catalog/shared/search-input"
import { SECTION_ICONS } from "@/components/catalog/sections/icons"
import { SectionCardPreview } from "@/components/catalog/sections/card-preview"
import type { SectionCategory } from "@/components/catalog/sections/categories"
import type { CatalogueSection } from "@/components/catalog/sections/catalogue"

type Props = {
  sections: ReadonlyArray<CatalogueSection>
  categories: ReadonlyArray<SectionCategory>
  pinnedCategory: SectionCategory["id"]
}

/**
 * Client-side category browser for `/sections/[category]`.
 *
 * Owns the search-with-debounce state, the per-category count
 * calculation, and the two-column layout (sidebar + grid).
 *
 * Pre-refactor: this lived in
 * `apps/web/src/app/(product)/sections/_components/sections-category-browser.tsx`
 * — moved here to remove the per-surface `_components/`
 * directory.
 */

// Module-level icon map. Looked up by slug and rendered via
// `createElement` to satisfy the react-hooks/static-components
// rule (a `const Icon = ...` inside the render body would
// trigger it).
const ICON_BY_SLUG = new Map(Object.entries(SECTION_ICONS))

export function SectionsCategoryBrowserClient({
  sections,
  categories,
  pinnedCategory,
}: Props) {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase()

  const counts = useMemo(() => {
    const out = new Map<SectionCategory["id"], number>(
      categories.map((category) => [category.id, 0] as const)
    )
    for (const section of sections) {
      out.set(section.category, (out.get(section.category) ?? 0) + 1)
    }
    return out
  }, [sections, categories])

  const pinnedCategoryData = useMemo(
    () => categories.find((c) => c.id === pinnedCategory),
    [categories, pinnedCategory]
  )

  const filtered = useMemo(() => {
    if (!pinnedCategoryData) return []
    return sections.filter((section) => {
      if (section.category !== pinnedCategory) return false
      if (normalizedQuery.length > 0) {
        const haystack = `${section.name} ${section.description}`.toLowerCase()
        if (!haystack.includes(normalizedQuery)) return false
      }
      return true
    })
  }, [sections, pinnedCategory, pinnedCategoryData, normalizedQuery])

  if (!pinnedCategoryData) return null

  return (
    <section
      aria-label={`${pinnedCategoryData.name} sections`}
      className="grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border"
    >
      <CatalogSidebar
        heading="Sections"
        basePath="/sections"
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
            aria-label={`Search sections in ${pinnedCategoryData.name}`}
            className="flex-1 sm:max-w-sm"
          />
        </div>
        {filtered.length > 0 ? (
          <ul className="grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 lg:grid-cols-3 [&>li]:border-r [&>li]:border-b [&>li]:border-border [&>li:nth-child(2n)]:md:border-r-0 [&>li:nth-child(3n)]:lg:border-r-0 [&>li:nth-last-child(-n+2)]:md:border-b-0 [&>li:nth-last-child(-n+3)]:lg:border-b-0">
            {filtered.map((section) => (
              <li key={section.slug}>
                <CatalogCard
                  href={`/sections/${section.category}/${section.slug}`}
                  ariaLabel={`Read the ${section.name} section`}
                  preview={<SectionCardPreview section={section} />}
                  title={
                    <div className="flex items-start gap-3">
                      {createElement(ICON_BY_SLUG.get(section.slug) ?? Wrench, {
                        "aria-hidden": true,
                        className:
                          "text-muted-foreground mt-0.5 size-4 shrink-0",
                      })}
                      <span>{section.name}</span>
                    </div>
                  }
                  description={section.description}
                />
              </li>
            ))}
          </ul>
        ) : (
          <CatalogEmptyState
            title="No sections match."
            description="Try a different search term."
          />
        )}
      </div>
    </section>
  )
}
