import { Calendar } from "lucide-react"
import type { Release } from "@/lib/blog/types"

import { AuthorAvatarLink } from "./author-avatar"

/**
 * Header byline for a single release (used on the changelog detail page).
 *
 * Renders the version chip on the left, the date on the right, and
 * an overlapping author avatar cluster below. Category badges are
 * intentionally omitted here — they live on the timeline row in
 * `ReleaseTimelineRow` to keep the detail page header clean.
 */
export function ReleaseMeta({ release }: { release: Release }) {
  return (
    <div className="flex flex-col gap-4 text-sm text-muted-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground/80">
          v{release.version}
        </code>
        <div className="flex items-center gap-1 text-xs">
          <Calendar className="size-3.5" />
          <time dateTime={release.date}>{release.date}</time>
        </div>
      </div>
      {release.authors.length > 0 ? (
        <div className="flex items-center">
          {release.authors.map((author, i) => (
            <span
              key={author.handle}
              className={i === 0 ? "" : "-ml-2 ring-2 ring-background"}
            >
              <AuthorAvatarLink author={author} size={28} />
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
