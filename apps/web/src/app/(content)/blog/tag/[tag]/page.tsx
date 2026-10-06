import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@workspace/ui/components/badge"
import { BlogSearch } from "@/components/blog/blog-search"
import { FlickeringGrid } from "@/app/(marketing)/_components/flickering-grid"
import { getPostsByTag } from "@/lib/blog/posts"
import { BLOG_TAG_LABELS, BLOG_TAGS, type BlogTag, getAllTags } from "@/lib/blog/types"

type Params = { tag: string }

export function generateStaticParams(): Array<Params> {
  return getAllTags().map((tag) => ({ tag: encodeURIComponent(tag) }))
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const blogTag = decoded as BlogTag
  const label = BLOG_TAG_LABELS[blogTag]
  const postCount = getPostsByTag(blogTag).length
  const path = `/blog/tag/${encodeURIComponent(decoded)}`
  return {
    title: label,
    description: `${postCount} ${postCount === 1 ? "post" : "posts"} tagged "${label}" on the DeesseJS blog.`,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      siteName: "DeesseJS",
      locale: "en_US",
      title: `${label} — Blog`,
      description: `Articles tagged ${label}.`,
      url: path,
    },
    twitter: {
      card: "summary",
      title: `${label} — Blog`,
      description: `Articles tagged ${label}.`,
    },
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
  const label = BLOG_TAG_LABELS[blogTag]
  const posts = getPostsByTag(blogTag)
  const tags = getAllTags()
  const featured = posts[0] ? [posts[0]] : []

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
            Tag
          </p>
          <h1 className="text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56">
            {label}
          </h1>
          <p className="max-w-2xl text-copy-18 leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
            {posts.length} {posts.length === 1 ? "post" : "posts"} tagged
            with this topic. Subscribe via{" "}
            <a
              href="/blog/feed.xml"
              className="underline underline-offset-4 hover:text-foreground"
            >
              RSS
            </a>{" "}
            for the full feed.
          </p>
        </div>
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