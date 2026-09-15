import type { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"
import { BlogSearch } from "@/components/blog/blog-search"
import { getPostsByTag } from "@/lib/blog/posts"
import { getAllTags } from "@/lib/blog/types"

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
  const posts = getPostsByTag(decoded)
  const tags = getAllTags()
  const featured = posts[0]

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
