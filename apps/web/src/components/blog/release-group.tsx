import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"
import type { Release, ReleaseCategory } from "@/lib/blog/types"
import { RELEASE_CATEGORY_LABELS } from "@/lib/blog/types"

import { AuthorAvatarLink } from "./author-avatar"

const CATEGORY_VARIANT: Record<
  ReleaseCategory,
  "default" | "secondary" | "outline"
> = {
  added: "default",
  changed: "secondary",
  fixed: "secondary",
  deprecated: "outline",
  removed: "outline",
  security: "default",
}

/** Format `YYYY-MM-DD` as `11 September` for desktop and `11 Sep` for mobile. */
function formatReleaseDate(date: string): {
  full: string
  short: string
} {
  const [year, month, day] = date.split("-").map(Number)
  if (!year || !month || !day) return { full: date, short: date }
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  const monthShort = months[month - 1]?.slice(0, 3) ?? ""
  return {
    full: `${day} ${months[month - 1] ?? ""}`,
    short: `${day} ${monthShort}`,
  }
}

/**
 * One release row inside the timeline. Mirrors Vercel's structure:
 *
 * - `col-span-full` so the row spans the parent 12-col grid.
 * - `grid-cols-subgrid` so the inner cells inherit the parent cols.
 * - `lg:col-start-4 lg:col-span-8` so the content sits in cols 4–11
 *   on desktop (leaving cols 1–3 for the date).
 * - `relative` + `::before` paints a 1px vertical rail that descends
 *   through the row height; `last-of-type:before:h-0` (applied at
 *   the parent ul level) hides the rail of the very last release
 *   so it doesn't run into the void.
 * - `::after` is the small 12px horizontal tick at 25px from the
 *   top of the row that bridges the rail to the release content.
 * - Inside the row, two children: a col-span-2 date cell and a
 *   col-span-6 content cell (the release `<article>` wrapped in a
 *   `<Link>`).
 */
function ReleaseTimelineRow({
  release,
  isLast,
}: {
  release: Release
  isLast: boolean
}) {
  const date = formatReleaseDate(release.date)

  return (
    <li
      className={
        "col-span-full grid grid-cols-subgrid items-baseline gap-6 " +
        "lg:col-start-4 lg:col-span-8 relative " +
        "before:content-[''] before:block before:h-[calc(100%+1px)] " +
        "before:w-px before:bg-border before:rounded-sm " +
        "before:absolute before:top-[25px] " +
        "after:content-[''] after:absolute after:block after:h-px " +
        "after:w-3 after:bg-border after:rounded-sm after:top-[25px] " +
        (isLast ? "after:hidden " : "")
      }
    >
      <div className="col-span-1 lg:col-span-2">
        <span className="ml-6 flex items-center gap-3 text-sm font-medium text-foreground">
          <time dateTime={release.date}>
            <span className="hidden lg:inline">{date.full}</span>
            <span className="lg:hidden">{date.short}</span>
          </time>
        </span>
      </div>
      <article className="col-span-3 lg:col-span-6">
        <Link
          href={release.url}
          className="-ml-6 -mt-6 mb-6 flex cursor-pointer flex-col gap-5 rounded-sm p-6 pr-0 transition-all duration-200 ease-in-out hover:bg-accent/30 focus-visible:bg-accent/30 focus-visible:outline-none"
        >
          <h2 className="pr-6 text-balance text-[28px] font-medium leading-9 tracking-tight text-foreground lg:text-[32px]">
            {release.title}
          </h2>
          <div className="pr-6 text-base leading-relaxed text-foreground/90">
            {release.description}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {release.categories.map((cat) => (
              <Badge
                key={cat}
                variant={CATEGORY_VARIANT[cat]}
                className="text-[10px] font-medium uppercase tracking-wider"
              >
                {RELEASE_CATEGORY_LABELS[cat]}
              </Badge>
            ))}
            {release.authors.length > 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  {release.authors.map((author, i) => (
                    <span
                      key={author.handle}
                      className={i === 0 ? "" : "-ml-2 ring-2 ring-background"}
                    >
                      <AuthorAvatarLink
                        author={author}
                        size={16}
                        asLink={false}
                      />
                    </span>
                  ))}
                </div>
                <span className="text-sm text-pretty">
                  {release.authors.map((a) => a.name).join(", ")}
                </span>
              </div>
            ) : null}
          </div>
        </Link>
      </article>
    </li>
  )
}

/**
 * Bordered-card wrapper around all release rows.
 *
 * Each release is its own `<li>` inside a single `<ul>`; the layout is
 * a 12-col grid (`grid-cols-12`) on desktop and 4-col on mobile
 * (`max-lg:grid-cols-4`). The rail and tick are painted per-row
 * (see `ReleaseTimelineRow`).
 */
export function ReleaseTimeline({ releases }: { releases: Release[] }) {
  if (releases.length === 0) return null

  return (
    <div className="border border-border bg-background rounded-none py-6">
      <ul className="m-0 grid list-none grid-cols-4 gap-x-6 gap-y-0 p-0 lg:grid-cols-12 [&>li:last-of-type]:before:h-0">
        {releases.map((release, i) => (
          <ReleaseTimelineRow
            key={release.slug}
            release={release}
            isLast={i === releases.length - 1}
          />
        ))}
      </ul>
    </div>
  )
}
