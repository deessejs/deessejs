import type { Post } from "@/lib/blog/types"

import { PostCard } from "./post-card"

/**
 * Featured hero row rendered above the main grid in `PostCardGrid`.
 *
 * Layout: 1 column on mobile, 2 columns on `lg+`. Each cell carries
 * explicit top/left borders that are toggled per breakpoint so the
 * row reads as a single shared-border surface. No `border-b` on the
 * cells (the outer wrapper supplies the bottom of the row); no
 * negative-margin trick (the simple `border-t` / `border-l` selectors
 * do the same work without needing the wrapper to clip the last
 * border).
 */
export function FeaturedRow({
  featured,
}: {
  featured: ReadonlyArray<Post>
}) {
  return (
    <ul
      aria-label="Featured posts"
      className={[
        "m-0 grid list-none grid-cols-1 p-0 lg:grid-cols-2",
        "[&>li]:min-w-0 [&>li]:border-border",
        "[&>li:nth-child(n+2)]:border-t",
        "lg:[&>li]:border-t-0",
        "lg:[&>li:nth-child(n+3)]:border-t",
        "lg:[&>li:nth-child(2n)]:border-l",
      ].join(" ")}
    >
      {featured.map((post) => (
        <li key={post.slug}>
          <PostCard post={post} featured />
        </li>
      ))}
    </ul>
  )
}
