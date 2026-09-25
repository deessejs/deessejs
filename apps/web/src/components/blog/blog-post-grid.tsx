import type { Post } from "@/lib/blog/types"

import { PostCard } from "./post-card"

/**
 * Recipe B post grid for /blog index and the blog-search component.
 *
 * Layout:
 * - Optional featured row at the top: 1-2 `<PostCard>` cells in a
 *   1/2-col grid, separated from the main grid by `border-b`.
 * - All other posts as standard `<PostCard>` cells in a 1/2/3/4-col
 *   grid with shared borders.
 *
 * The grid relies on Tailwind nth-child selectors to drop the trailing
 * borders on the rightmost and bottom cells so the grid sits inside a
 * single shared-border wrapper.
 */
export function BlogPostGrid({
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

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      {/* 1. Featured row — 1 PostCard on mobile, 2 PostCards on lg+.
          Each card is a full PostCard so the featured row reads as
          a hero pair, not a different bespoke layout. */}
      {featured && featured.length > 0 ? (
        <ul className="grid list-none grid-cols-1 p-0 lg:grid-cols-2">
          {featured.map((post, index) => (
            <li
              key={post.slug}
              className={
                index === 0
                  ? "border-b border-border lg:border-b lg:border-r"
                  : "border-b border-border"
              }
            >
              <PostCard post={post} featured />
            </li>
          ))}
        </ul>
      ) : null}

      {/* 2. Grille de cartes (Zéro nth-child, zéro double bordure) */}
      {filteredPosts.length > 0 ? (
        <ul className="-mr-px -mb-px grid list-none grid-cols-1 p-0 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredPosts.map((post) => (
            <li
              key={post.slug}
              className="border-b border-r border-border"
            >
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
