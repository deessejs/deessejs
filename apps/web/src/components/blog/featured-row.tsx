import type { Post } from "@/lib/blog/types"

import { PostCard } from "./post-card"

/**
 * Featured hero row rendered above the main grid in `PostCardGrid`.
 *
 * Layout: 1 column on mobile, 2 columns on `lg+`. Same border
 * strategy as the main grid: each cell carries `border-r border-b`;
 * the `<ul>` shifts by `-mr-px -mb-px` so the wrapper's
 * `overflow-hidden` clips the rightmost and last borders against
 * the outer frame.
 */
export function FeaturedRow({ featured }: { featured: ReadonlyArray<Post> }) {
  return (
    <ul
      aria-label="Featured posts"
      className="-mr-px -mb-px grid list-none grid-cols-1 p-0 lg:grid-cols-2"
    >
      {featured.map((post) => (
        <li key={post.slug} className="min-w-0 border-r border-b border-border">
          <PostCard post={post} featured />
        </li>
      ))}
    </ul>
  )
}
