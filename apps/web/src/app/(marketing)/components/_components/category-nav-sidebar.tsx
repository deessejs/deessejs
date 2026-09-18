import Link from "next/link"

import type { CategoryId, ComponentCategory } from "./categories"

type Props = {
  categories: ReadonlyArray<ComponentCategory>
  pinned: CategoryId
  counts: Record<CategoryId, number>
}

/**
 * Server component. Sticky nav sidebar for
 * `/components/[category]` — lists every category as a link, with
 * the active one marked via `aria-current="page"` and a subtle
 * background. Acts as a "table of contents" for the catalogue so
 * the visitor can jump between categories without going back to
 * the index.
 *
 * Sticky on desktop (`lg:sticky lg:top-20 lg:self-start`) so the
 * list stays visible while the grid on the right scrolls past.
 *
 * The `count` per category is the total catalogue size — not the
 * current filter state — because the nav sidebar is a static
 * index, not a filter surface.
 */
export function CategoryNavSidebar({ categories, pinned, counts }: Props) {
  return (
    <aside
      aria-label="Component categories"
      className="flex w-full flex-col gap-3 lg:sticky lg:top-20 lg:self-start"
    >
      <h2 className="text-label-13 uppercase tracking-wider text-muted-foreground">
        Categories
      </h2>
      <ul className="flex flex-col gap-1">
        {categories.map((category) => {
          const isActive = category.id === pinned
          return (
            <li key={category.id}>
              <Link
                href={`/components/${category.slug}`}
                aria-current={isActive ? "page" : undefined}
                className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-copy-14 transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-[current=page]:bg-accent/30"
              >
                <span className="flex-1 truncate font-medium text-foreground">
                  {category.name}
                </span>
                <span className="text-label-13 text-muted-foreground tabular-nums">
                  {counts[category.id]}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}