import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"
import { PostCard } from "@/components/blog/post-card"
import { SearchDialog } from "@/components/blog/search-dialog"
import { getAllPosts } from "@/lib/blog/posts"
import { getAllTags } from "@/lib/blog/types"

export const metadata: Metadata = {
  title: "Blog",
  description: "Articles and updates.",
  alternates: {
    canonical: "/blog",
    types: {
      "application/rss+xml": "/blog/feed.xml",
    },
  },
}

export default function BlogPage() {
  const posts = getAllPosts()
  const tags = getAllTags()
  const featured = posts[0]
  const rest = posts.slice(1)

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <header className="mb-8">
        <h1 className="text-balance text-4xl font-bold tracking-tighter sm:text-5xl">
          Blog
        </h1>
        <p className="mt-2 text-pretty text-lg text-muted-foreground">
          Articles and updates. Subscribe via{" "}
          <a
            href="/blog/feed.xml"
            className="underline underline-offset-4 hover:text-foreground"
          >
            RSS
          </a>
          .
        </p>
      </header>

      {tags.length > 0 && (
        <nav
          aria-label="Filter by tag"
          className="mb-8 flex flex-wrap items-center justify-between gap-2 border-y border-border/40 py-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Topics
            </span>
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog/tag/${encodeURIComponent(tag)}`}
              >
                <Badge
                  variant="outline"
                  className="cursor-pointer transition-colors hover:bg-foreground hover:text-background"
                >
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
          <SearchDialog />
        </nav>
      )}

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            No posts yet
          </p>
          <p className="mt-3 max-w-md text-pretty text-base text-muted-foreground">
            Subscribe to the{" "}
            <a
              href="/blog/feed.xml"
              className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              RSS feed
            </a>{" "}
            to be notified when we publish.
          </p>
        </div>
      ) : (
        <>
          {featured ? (
            <div className="mb-12 overflow-hidden rounded-xl border border-border/40">
              <Link href={featured.url} className="block">
                {featured.cover ? (
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <Image
                      src={featured.cover}
                      alt=""
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 1200px"
                    />
                  </div>
                ) : null}
                <div className="bg-muted/20 p-8">
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
                            className="rounded-full border border-border/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                          >
                            {tag}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight">
                    {featured.title}
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    {featured.description}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    by{" "}
                    {featured.authors[0]?.name ?? featured.author?.name}
                  </p>
                </div>
              </Link>
            </div>
          ) : null}

          {rest.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
