import type { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"
import { BlogSearch } from "@/components/blog/blog-search"
import { FlickeringGrid } from "@/app/[locale]/(marketing)/_components/flickering-grid"
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
  const featured = posts.slice(0, 2)

  return (
    <section>
      <header className="relative overflow-hidden border-b border-border">
        <FlickeringGrid
          className="absolute inset-0 z-0 opacity-60"
          squareSize={3}
          gridGap={5}
          flickerChance={0.15}
          maxOpacity={0.18}
          color="rgb(120, 120, 120)"
        />
        <div className="relative z-10 flex flex-col items-center gap-3 px-6 py-16 text-center sm:py-20 lg:py-24">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Blog
          </p>
          <h1 className="text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56">
            Articles and updates.
          </h1>
          <p className="max-w-2xl text-copy-18 leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
            Subscribe via{" "}
            <a
              href="/blog/feed.xml"
              className="underline underline-offset-4 hover:text-foreground"
            >
              RSS
            </a>
            , or browse the latest from the team: posts on the
            stack, the contracts, and the registry.
          </p>
        </div>
      </header>

      {tags.length > 0 ? (
        <BlogSearch
          posts={posts}
          featured={featured}
          topics={
            <nav aria-label="Filter by tag" className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Topics
              </span>
              <Link href="/blog" aria-current="page">
                <Badge
                  variant="default"
                  className="cursor-pointer"
                >
                  All topics
                </Badge>
              </Link>
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
              <Link href="/changelog">
                <Badge
                  variant="outline"
                  className="cursor-pointer transition-colors hover:bg-foreground hover:text-background"
                >
                  Changelog
                </Badge>
              </Link>
            </nav>
          }
        />
      ) : (
        <BlogSearch
          posts={posts}
          featured={featured}
          topics={
            <nav aria-label="Related sections" className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Topics
              </span>
              <Link href="/blog" aria-current="page">
                <Badge
                  variant="default"
                  className="cursor-pointer"
                >
                  All topics
                </Badge>
              </Link>
              <Link href="/changelog">
                <Badge
                  variant="outline"
                  className="cursor-pointer transition-colors hover:bg-foreground hover:text-background"
                >
                  Changelog
                </Badge>
              </Link>
            </nav>
          }
        />
      )}
    </section>
  )
}
