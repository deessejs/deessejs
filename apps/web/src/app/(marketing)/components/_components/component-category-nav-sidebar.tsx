import Link from "next/link"

import type { CatalogueComponent } from "./components-list"

type Props = {
  components: ReadonlyArray<CatalogueComponent>
  /** Slug of the currently-open component (the leaf page). */
  pinned?: string
}

/**
 * Sticky nav sidebar for `/components/[category]`. Lists every
 * component in the category as a `<Link>` to its own leaf page.
 * Active state marked via `aria-current="page"` when `pinned`
 * matches.
 *
 * Mirror of `blocks-category-nav-sidebar.tsx`.
 */
export function ComponentCategoryNavSidebar({ components, pinned }: Props) {
  return (
    <aside className="flex w-full flex-col gap-3 p-6 lg:sticky lg:top-20 lg:self-start">
      <h2 className="text-label-13 uppercase tracking-wider text-muted-foreground">
        Components
      </h2>
      <ul className="flex flex-col gap-1">
        {components.map((component) => {
          const isActive = pinned === component.slug
          return (
            <li key={component.slug}>
              <Link
                href={`/components/${component.category}/${component.slug}`}
                aria-current={isActive ? "page" : undefined}
                className="block rounded-md px-3 py-2 text-copy-14 font-medium transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-[current=page]:bg-accent/30"
              >
                <span className="block truncate text-foreground">
                  {component.name}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}