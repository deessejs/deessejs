import Link from "next/link"

import type {
  BlockCategoryId,
  BlockCategory,
} from "./block-categories"

type Props = {
  categories: ReadonlyArray<BlockCategory>
  pinned?: BlockCategoryId
  counts: Record<BlockCategoryId, number>
}

/**
 * Mirror of `CatalogueSidebar` in the blocks registry.
 * Pure navigation sidebar — `<Link>` per category.
 */
export function BlocksSidebar({ categories, pinned, counts }: Props) {
  return (
    <aside className="flex w-full flex-col gap-3 p-6 lg:sticky lg:top-20 lg:self-start">
      <h2 className="text-label-13 uppercase tracking-wider text-muted-foreground">
        Categories
      </h2>
      <ul className="flex flex-col gap-1">
        {categories.map((category) => {
          const isActive = pinned === category.id
          return (
            <li key={category.id}>
              <Link
                href={`/blocks/${category.slug}`}
                aria-current={isActive ? "page" : undefined}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-copy-14 font-medium transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-[current=page]:bg-accent/30"
              >
                <span className="flex-1 truncate text-left text-foreground">
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