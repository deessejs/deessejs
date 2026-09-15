"use client"

import { useDeferredValue, useMemo, useState } from "react"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { getComponentIcon } from "./component-icon"
import type { CatalogueComponent } from "./components-list"
import type { ComponentCategory } from "./categories"
import { SearchInput } from "./search-input"

type Props = {
  components: ReadonlyArray<CatalogueComponent>
  category: ComponentCategory
}

/**
 * Client wrapper around `<ComponentListSidebar>` for
 * `/components/[category]`. Adds a text-search field above the
 * list that filters by name (case-insensitive substring match).
 *
 * Calque du pattern `apps/web/src/components/blog/blog-search.tsx:29-41` :
 * `useState` + `useDeferredValue` → `useMemo` filter. Set size of
 * ≤24 entries — pas besoin d'un index Fuzzy.
 *
 * Empty-results state shows a centred message in the sidebar zone
 * (not in the right column) so the affordance stays in place.
 */
export function CategorySearchableList({ components, category }: Props) {
  const [query, setQuery] = useState("")
  const deferred = useDeferredValue(query)
  const normalized = deferred.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (normalized.length === 0) return components
    return components.filter((component) =>
      component.name.toLowerCase().includes(normalized),
    )
  }, [components, normalized])

  return (
    <aside className="flex w-full flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
      <h2 className="text-label-13 uppercase tracking-wider text-muted-foreground">
        {category.name}
      </h2>
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={`Search ${category.name.toLowerCase()}…`}
        aria-label={`Search components in ${category.name}`}
      />
      {filtered.length === 0 ? (
        <p
          role="status"
          aria-live="polite"
          className="text-copy-13 text-muted-foreground px-1 py-2"
        >
          No components match &ldquo;{deferred}&rdquo;.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {filtered.map((component) => {
            const Icon = getComponentIcon(component.slug)
            return (
              <li key={component.slug}>
                <Link
                  href={`/components/${category.slug}/${component.slug}`}
                  aria-label={`Read the ${component.name} component`}
                  className="group flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Icon
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="text-label-14 font-medium text-foreground flex-1 truncate">
                    {component.name}
                  </span>
                  <ChevronRight
                    className="size-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}