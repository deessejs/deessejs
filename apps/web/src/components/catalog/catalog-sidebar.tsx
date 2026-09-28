import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

type Props<Id extends string> = {
  /** Heading shown above the entry list. Always "Categories" today. */
  heading: string
  /**
   * Base path for entry links. The actual `href` is built as
   * `${basePath}/${entry.slug}`.
   */
  basePath: string
  entries: ReadonlyArray<{
    id: Id
    slug: string
    name: string
  }>
  /** Active entry id, if any. Marked with `aria-current="page"`. */
  pinned?: Id
  counts?: Record<Id, number>
  /** Optional extra classes on the wrapping `<aside>`. */
  className?: string
}

/**
 * Catalog chrome: category sidebar.
 *
 * Sticky nav sidebar that lists every category on a `/<surface>`
 * index page (Buttons / Inputs / Badges for components, Hero /
 * CTA / Feature / etc. for blocks). Each entry is a `<Link>` to
 * its category drilldown; an optional count badge appears on the
 * right when `counts[id]` is provided.
 *
 * Pre-refactor: this was duplicated across
 * `apps/web/src/app/(product)/components/_components/component-list-sidebar.tsx`
 * and `apps/web/src/app/(product)/components/_components/component-nav-sidebar.tsx`
 * (the two were structurally identical; only the type bindings
 * and JSDoc differed), plus the blocks mirror
 * `apps/web/src/app/(product)/blocks/_components/blocks-sidebar.tsx`.
 * All three have been replaced with calls to this component.
 */
export function CatalogSidebar<Id extends string>({
  heading,
  basePath,
  entries,
  pinned,
  counts,
  className,
}: Props<Id>) {
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
        {entries.map((entry) => {
          const isActive = pinned === entry.id
          const count = counts?.[entry.id]
          return (
            <li key={entry.id}>
              <Link
                href={`${basePath}/${entry.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-copy-14 font-medium transition-colors",
                  "hover:bg-accent/30",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "aria-[current=page]:bg-accent/30",
                )}
              >
                <span className="flex-1 truncate text-left text-foreground">
                  {entry.name}
                </span>
                {typeof count === "number" ? (
                  <span className="text-label-13 text-muted-foreground tabular-nums">
                    {count}
                  </span>
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
