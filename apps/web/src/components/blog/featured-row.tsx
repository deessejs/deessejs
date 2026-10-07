import type { Post } from "@/lib/blog/types"

import { PostCard } from "./post-card"

/**
 * Featured hero row rendered above the main grid in `PostCardGrid`.
 *
 * Layout: 1 column on mobile, 2 columns on `lg+`. No `border-b` on the
 * cells — the first row of the main grid supplies the visual divider,
 * so we avoid the 2-px double rule that the previous inline implementation
 * produced. The last cell only carries its right border at `lg+` (where
 * the 2-column grid kicks in); at `sm` the row is single-column and a
 * right border would point at nothing. The outer wrapper's
 * `overflow-hidden` in `PostCardGrid` clips the right edge at `lg+`.
 *
 * `index === featured.length - 1` (not `=== 0`) so the layout scales past
 * 2 cards without silently dropping separators.
 */
export function FeaturedRow({
  featured,
}: {
  featured: ReadonlyArray<Post>
}) {
  return (
    <ul
      aria-label="Featured posts"
      className="grid list-none grid-cols-1 p-0 lg:grid-cols-2"
    >
      {featured.map((post, index) => (
        <li
          key={post.slug}
          className={
            index === featured.length - 1
              ? "border-b-0 border-border lg:border-r"
              : "border-b-0 border-r border-border"
          }
        >
          <PostCard post={post} featured />
        </li>
      ))}
    </ul>
  )
}