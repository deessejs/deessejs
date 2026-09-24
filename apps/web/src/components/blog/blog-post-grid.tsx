import type { Post } from "@/lib/blog/types"

import { FeaturedRow } from "./featured-row"
import { PostCard } from "./post-card"

/**
 * Shared `PostCard` grid for every blog surface: `/blog`, `/blog/tag/[tag]`,
 * `/blog/author/[handle]`, and the "Related reading" block on `/blog/[slug]`.
 *
 * Layout:
 * - Optional featured row at the top, rendered by `FeaturedRow`
 *   (1 column mobile, 2 columns `lg+`). No per-cell `border-b` — the
 *   first row of the main grid supplies the visual divider.
 * - Main grid renders the remaining posts. Responsive column count is
 *   controlled by `gridCols`.
 *
 * Border strategy (Pattern B — see `.claude/skills/tailwind-borders`):
 * - Outer wrapper `overflow-hidden rounded-xl border border-border
 *   bg-background` is the single source of the visible frame.
 * - Inner `<ul>` shifts by `-mr-px -mb-px` so the last row's bottom and
 *   the last column's right borders are clipped by the wrapper instead
 *   of doubling against it.
 * - Each cell carries `border-b border-r border-border`. No `nth-child`
 *   needed — the negative-margin trick gives us the shared-border
 *   surface for any column count.
 */
const GRID_COLS_CLASS: Record<"1-2-3" | "1-2-3-4", string> = {
  "1-2-3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "1-2-3-4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4",
}

export function PostCardGrid({
  posts,
  featured,
  gridCols = "1-2-3-4",
}: {
  posts: ReadonlyArray<Post>
  featured?: ReadonlyArray<Post> | undefined
  gridCols?: "1-2-3" | "1-2-3-4"
}) {
  if (posts.length === 0 && (!featured || featured.length === 0)) {
    return null
  }

  const featuredSlugs = new Set(featured?.map((p) => p.slug) ?? [])
  const filteredPosts = posts.filter((post) => !featuredSlugs.has(post.slug))

  const mainAriaLabel =
    featured && featured.length > 0 ? "All blog posts" : "Posts"

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      {featured && featured.length > 0 ? (
        <FeaturedRow featured={featured} />
      ) : null}

      {filteredPosts.length > 0 ? (
        <ul
          aria-label={mainAriaLabel}
          className={`-mr-px -mb-px grid list-none p-0 ${GRID_COLS_CLASS[gridCols]}`}
        >
          {filteredPosts.map((post) => (
            <li className="border-b border-r border-border">
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}