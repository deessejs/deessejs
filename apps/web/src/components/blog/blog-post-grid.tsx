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
 * carries `border-r border-b`; the inner `<ul>` shifts by
 * `-mr-px -mb-px` so the rightmost column's right border and the
 * last row's bottom border are clipped by the wrapper's
 * `overflow-hidden` instead of doubling against the outer frame.
 * This keeps a single visible 1-px rule on every interior edge
 * (between two cells, and between a cell and the frame) without
 * any per-cell `nth-child` selectors. Card `ring-0` (set in
 * `post-card.tsx`) keeps the focus outline from doubling against
 * the cell border.
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
    <div className="overflow-hidden rounded-none border border-border bg-background">
      {featured && featured.length > 0 ? (
        <FeaturedRow featured={featured} />
      ) : null}

      {filteredPosts.length > 0 ? (
        <ul
          aria-label={mainAriaLabel}
          className={[
            "-mr-px -mb-px grid list-none grid-cols-1 p-0",
            "sm:grid-cols-2 lg:grid-cols-3",
            // Visual divider between the featured row and the main
            // grid when featured is present. FeaturedRow does not
            // draw a bottom border (the first row of the main grid
            // carries the visual divider via `border-b` on each cell),
            // so this `border-t` on the <ul> is the explicit
            // featured-to-grid separator.
            featured && featured.length > 0 ? "border-t border-border" : "",
          ].join(" ")}
        >
          {filteredPosts.map((post) => (
            <li
              key={post.slug}
              className="min-w-0 border-r border-b border-border"
            >
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
