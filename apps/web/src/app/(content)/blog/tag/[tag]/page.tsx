import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@workspace/ui/components/badge"
import { BlogSearch } from "@/components/blog/blog-search"
import { getPostsByTag } from "@/lib/blog/posts"
import { BLOG_TAGS, type BlogTag, getAllTags } from "@/lib/blog/types"

type Params = { tag: string }

export function generateStaticParams(): Array<Params> {
  return getAllTags().map((tag) => ({ tag: encodeURIComponent(tag) }))
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  return {
    title: `Posts tagged "${decoded}" — Blog`,
    description: `Articles tagged ${decoded}.`,
  }
}

export default async function TagPage(
  { params }: { params: Promise<Params> },
) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  // Refuse unknown tags: they're not part of our closed set, so a
  // 404 is more honest than rendering an empty index. Casting the
  // string to `BlogTag` would skip this check and lie to callers.
  if (!BLOG_TAGS.includes(decoded as BlogTag)) {
    notFound()
  }
  const blogTag = decoded as BlogTag
  const posts = getPostsByTag(blogTag)
  const tags = getAllTags()
  const featured = posts[0]

  return (
    <section>
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

      <BlogSearch
        posts={posts}
        featured={featured}
        topics={
          <nav
            aria-label="Filter by tag"
            className="flex flex-wrap items-center gap-2"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Topics
            </span>
            <Link href="/blog">
              <Badge
                variant="outline"
                className="cursor-pointer transition-colors hover:bg-foreground hover:text-background"
              >
                All topics
              </Badge>
            </Link>
            {tags.map((t) => {
              const isActive = t === decoded
              return (
                <Link
                  key={t}
                  href={`/blog/tag/${encodeURIComponent(t)}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Badge
                    variant={isActive ? "default" : "outline"}
                    className={
                      isActive
                        ? "cursor-pointer"
                        : "cursor-pointer transition-colors hover:bg-foreground hover:text-background"
                    }
                  >
                    {t}
                  </Badge>
                </Link>
              )
            })}
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
    </section>
  )
}
