import Image from "next/image"
import Link from "next/link"
import type { Post } from "@/lib/blog/types"

import { AuthorAvatarLink } from "./author-avatar"
import { PostCard } from "./post-card"

/**
 * Recipe B post grid for /blog index and the blog-search component.
 *
 * Layout:
 * - Optional featured post as a full-width `<li>` (only when `featured`
 *   is provided and the list is unfiltered).
 * - All other posts as standard `<PostCard>` cells in a 1/2/3-column
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
  posts: Post[]
  featured?: Post | undefined
}) {
  if (posts.length === 0 && !featured) {
    return null
  }

  const featuredAuthor = featured?.authors?.[0] ?? featured?.author

  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 lg:grid-cols-3 [&>li]:border-r [&>li]:border-b [&>li]:border-border [&>li:nth-child(2n)]:md:border-r-0 [&>li:nth-child(3n)]:lg:border-r-0 [&>li:nth-last-child(-n+2)]:md:border-b-0 [&>li:nth-last-child(-n+3)]:lg:border-b-0 [&>li:first-child]:border-t">
      {featured ? (
        <li key={featured.slug} className="sm:col-span-2 lg:col-span-3">
          <article className="group flex h-full flex-col transition-colors hover:bg-accent/30">
            {featured.cover ? (
              <Link
                href={featured.url}
                className="relative block aspect-video w-full overflow-hidden bg-muted"
                tabIndex={-1}
                aria-hidden="true"
              >
                <Image
                  src={featured.cover}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority
                  sizes="(max-width: 768px) 100vw, 1200px"
                />
              </Link>
            ) : null}
            <div className="flex flex-col gap-3 p-8">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <time dateTime={featured.date}>{featured.date}</time>
                <span aria-hidden>·</span>
                <span>{featured.readingTime} min read</span>
                {featured.tags.length > 0 && (
                  <>
                    <span aria-hidden>·</span>
                    {featured.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                      >
                        {tag}
                      </span>
                    ))}
                  </>
                )}
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                <Link
                  href={featured.url}
                  className="transition-colors hover:text-foreground"
                >
                  {featured.title}
                </Link>
              </h2>
              <p className="text-muted-foreground">{featured.description}</p>
              {featuredAuthor ? (
                <span className="mt-1">
                  <AuthorAvatarLink author={featuredAuthor} size={32} />
                </span>
              ) : null}
            </div>
          </article>
        </li>
      ) : null}
      {posts
        // The featured post is already rendered in its own <li> above,
        // so skip it here to avoid duplicate cards.
        .filter((post) => post.slug !== featured?.slug)
        .map((post) => (
          <li key={post.slug}>
            <PostCard post={post} />
          </li>
        ))}
    </ul>
  )
}
