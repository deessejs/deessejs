"use client"

import { useDeferredValue, useMemo, useState } from "react"

import { CatalogCard } from "@/components/catalog/catalog-card"
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state"
import { CatalogItemNavSidebar } from "@/components/catalog/catalog-item-nav-sidebar"
import { SearchInput } from "@/components/catalog/shared/search-input"
import { ComponentCardPreview } from "@/components/catalog/components/card-preview"
import type { ComponentCategory } from "@/components/catalog/components/categories"
import type { CatalogueComponent } from "@/components/catalog/components/catalogue"

type Props = {
  category: ComponentCategory
  components: ReadonlyArray<CatalogueComponent>
}

/**
 * Client-side category browser for `/components/[category]`.
 *
 * Owns the search-with-debounce state and renders the
 * two-column layout (sidebar + grid). Kept as a separate client
 * component so the route file stays a Server Component and can
 * export `generateMetadata` / `generateStaticParams`.
 *
 * Pre-refactor: this lived in
 * `apps/web/src/app/(product)/components/_components/component-category-browser.tsx`
 * — moved here to remove the per-surface `_components/`
 * directory.
 */
export function ComponentCategoryBrowserClient({
  category,
  components,
}: Props) {
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
      <CatalogItemNavSidebar
        heading="Components"
        basePath="/components"
        items={components.map((component) => ({
          slug: component.slug,
          name: component.name,
          categoryId: component.category,
        }))}
      />
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
          <ul className="grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 lg:grid-cols-3 [&>li]:border-r [&>li]:border-b [&>li]:border-border [&>li:nth-child(2n)]:md:border-r-0 [&>li:nth-child(3n)]:lg:border-r-0 [&>li:nth-last-child(-n+2)]:md:border-b-0 [&>li:nth-last-child(-n+3)]:lg:border-b-0">
            {filtered.map((component) => (
              <li key={component.slug}>
                <CatalogCard
                  href={`/components/${component.category}/${component.slug}`}
                  ariaLabel={`Read the ${component.name} component`}
                  preview={<ComponentCardPreview slug={component.slug} />}
                  title={component.name}
                  description={component.description}
                />
              </li>
            ))}
          </ul>
        ) : (
          <CatalogEmptyState
            title="No components match."
            description="Try a different search term."
          />
        )}
      </div>
    </section>
  )
}
