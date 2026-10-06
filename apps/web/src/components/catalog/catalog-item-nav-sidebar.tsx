import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

type Props = {
  /** Heading shown above the entry list. Always "Components" / "Blocks" today. */
  heading: string
  /**
   * Base path for entry links. The actual `href` is built as
   * `${basePath}/${item.categoryId}/${item.slug}`.
   */
  basePath: string
  items: ReadonlyArray<{
    slug: string
    name: string
    categoryId: string
  }>
  /** Active item slug (the current leaf page), if any. */
  pinned?: string
  className?: string
}

/**
 * Catalog chrome: item nav sidebar.
 *
 * Sticky nav sidebar used on category drilldown pages
 * (`/<surface>/[category]`). Lists every item in the category as
 * a `<Link>` to its own leaf page. Active state is marked via
 * `aria-current="page"` when `pinned` matches the slug.
 *
 * Mirrors the behaviour of `CatalogSidebar`, but the items live
 * inside a category (so the URL needs `categoryId` as a segment)
 * and there is no count badge — items in a single category are
 * already shown inline.
 *
 * Pre-refactor: this was duplicated across
 * `apps/web/src/app/(product)/components/_components/component-category-nav-sidebar.tsx`
 * and its blocks mirror
 * `apps/web/src/app/(product)/blocks/_components/blocks-category-nav-sidebar.tsx`.
 * Both have been replaced with calls to this component.
 */
export function CatalogItemNavSidebar({
  heading,
  basePath,
  items,
  pinned,
  className,
}: Props) {
  return (
    <aside
      className={cn(
        "flex w-full flex-col gap-3 p-6 lg:sticky lg:top-20 lg:self-start",
        className,
      )}
    >
      <h2 className="text-label-13 uppercase tracking-wider text-muted-foreground">
        {heading}
      </h2>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = pinned === item.slug
          return (
            <li key={item.slug}>
              <Link
                href={`${basePath}/${item.categoryId}/${item.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block rounded-md px-3 py-2 text-copy-14 font-medium transition-colors",
                  "hover:bg-accent/30",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "aria-[current=page]:bg-accent/30",
                )}
              >
                <span className="block truncate text-foreground">
                  {item.name}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
