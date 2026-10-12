import type { Post } from "@/lib/blog/types"

import { FeaturedRow } from "./featured-row"
import { PostCard } from "./post-card"

/**
 * Shared `PostCard` grid for every blog surface: `/blog`, `/blog/tag/[tag]`,
 * `/blog/author/[handle]`, and the "Related reading" block on `/blog/[slug]`.
 *
 * Layout:
 * - Optional featured row at the top, rendered by `FeaturedRow`
 *   (1 column mobile, 2 columns `lg+`).
 * - Main grid renders the remaining posts. Always `1-2-3` columns
 *   (1 col mobile, 2 cols `sm+`, 3 cols `lg+`).
 *
 * Border strategy: the outer wrapper supplies the frame. Each cell
 * carries explicit top/left borders that are toggled per breakpoint so
 * the grid reads as a single shared-border surface with no double
 * rules and no orphan borders on the last row. No negative margins,
 * no `nth-child` arithmetic at the consumer level — the
 * `[&>li:nth-child(...)]` selectors are scoped to this component and
 * re-derived per breakpoint. The previous implementation used Pattern
 * B (`-mr-px -mb-px` + clip via `overflow-hidden`) and a `GRID_COLS_CLASS`
 * lookup; both were retired because they were redundant once the
 * column count was fixed at 3 max.
 */
export function PostCardGrid({
  posts,
  featured,
}: {
  posts: ReadonlyArray<Post>
  featured?: ReadonlyArray<Post> | undefined
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
          className={[
            "m-0 grid list-none grid-cols-1 p-0 sm:grid-cols-2 lg:grid-cols-3",
            "[&>li]:min-w-0 [&>li]:border-border",

            // Mobile: separation before every post except the first.
            "[&>li:nth-child(n+2)]:border-t",

            // Two columns: top reset, top borders from row 2 onwards,
            // left borders on every even cell.
            "sm:[&>li]:border-t-0",
            "sm:[&>li:nth-child(n+3)]:border-t",
            "sm:[&>li:nth-child(2n)]:border-l",

            // Three columns: same pattern, recomputed for 3 per row.
            "lg:[&>li]:border-t-0",
            "lg:[&>li]:border-l-0",
            "lg:[&>li:nth-child(n+4)]:border-t",
            "lg:[&>li:not(:nth-child(3n+1))]:border-l",

            // Visual divider between the featured row and the main
            // grid when featured is present.
            featured && featured.length > 0 ? "border-t border-border" : "",
          ].join(" ")}
        >
          {filteredPosts.map((post) => (
            <li key={post.slug}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
