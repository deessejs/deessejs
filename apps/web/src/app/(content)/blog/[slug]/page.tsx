import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Separator } from "@workspace/ui/components/separator"
import { WEB_URL } from "@/lib/urls"
import { AuthorBio } from "@/components/blog/author-bio"
import { PostCard } from "@/components/blog/post-card"
import { PostMeta } from "@/components/blog/post-meta"
import { MdxRenderer } from "@/components/blog/mdx-renderer"
import { TableOfContents } from "@/components/blog/table-of-contents"
import {
  getAdjacentPosts,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/blog/posts"
import { allPosts } from "content-collections"
import type { Post } from "@/lib/blog/types"
import { ORG_ID } from "@/lib/seo/organization"
import { buildPersonJsonLd } from "@/lib/seo/person-jsonld"
import { jsonLdScript } from "@/lib/json-ld"

type Params = { slug: string }

export function generateStaticParams(): Array<Params> {
  return allPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: `${post.title} — Blog`,
    description: post.description,
    authors: post.author ? [{ name: post.author.name }] : [],
    alternates: { canonical: post.url },
    openGraph: {
      type: "article",
      siteName: "DeesseJS",
      locale: "en_US",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated,
      authors: post.author ? [post.author.name] : [],
      tags: post.tags,
      url: post.url,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  }
}

export default async function PostPage(
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const related = getRelatedPosts(slug, 3)
  const { prev, next } = getAdjacentPosts(slug)

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.description,
            // schema.org expects ISO 8601 timestamps. Our frontmatter
            // stores `date` as `YYYY-MM-DD`, so anchor it at start of
            // day UTC. `updated` falls back to `datePublished` only
            // when the editorial record has no `updated` field; never
            // pretend an article was modified when it was not.
            datePublished: `${post.date}T00:00:00.000Z`,
            dateModified: post.updated
              ? `${post.updated}T00:00:00.000Z`
              : `${post.date}T00:00:00.000Z`,
            inLanguage: "en",
            keywords: post.tags,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${WEB_URL}${post.url}`,
            },
            url: `${WEB_URL}${post.url}`,
            ...(post.cover
              ? {
                  image: {
                    "@type": "ImageObject",
                    url: post.cover,
                  },
                }
              : {}),
            // Person node uses the same factory as /blog/author/[handle],
            // so the article-side and author-page-side Person share one
            // @id anchor in the crawler graph. See
            // `apps/web/src/lib/seo/person-jsonld.ts`.
            author: post.author ? buildPersonJsonLd(post.author) : undefined,
            publisher: { "@id": ORG_ID },
          }),
        }}
      />

      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to blog
      </Link>

      {post.cover ? (
        <figure className="mb-10 overflow-hidden rounded-xl border border-border/40 bg-muted">
          <div className="relative aspect-video w-full">
            <Image
              src={post.cover}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          </div>
        </figure>
      ) : null}

      <header className="mb-10">
        <h1 className="text-balance text-4xl font-bold tracking-tighter sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-pretty text-lg text-muted-foreground">
          {post.description}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <PostMeta post={post} />
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[1fr_180px] lg:gap-12">
        <div className="min-w-0">
          <MdxRenderer id="article-prose" className="mt-10" code={post.mdxCode} />
        </div>
        <aside className="hidden lg:block">
          <TableOfContents targetId="article-prose" />
        </aside>
      </div>

      <AuthorBio authors={post.authors} />

      {(prev || next) && (
        <>
          <Separator className="my-12" />
          <nav className="grid gap-4 sm:grid-cols-2" aria-label="Post navigation">
            {prev ? (
              <Link
                href={prev.url}
                className="group flex flex-col gap-1 rounded-lg border border-border/40 p-4 transition-colors hover:border-foreground/30 hover:bg-muted/30"
              >
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowLeft className="size-3" />
                  Previous
                </span>
                <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={next.url}
                className="group flex flex-col gap-1 rounded-lg border border-border/40 p-4 text-right transition-colors hover:border-foreground/30 hover:bg-muted/30"
              >
                <span className="inline-flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  Next
                  <ArrowRight className="size-3" />
                </span>
                <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground">
                  {next.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </>
      )}

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">
            Related reading
          </h2>
          <ul className="m-0 grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 lg:grid-cols-3 [&>li]:border-r [&>li]:border-b [&>li]:border-border [&>li:nth-child(2n)]:md:border-r-0 [&>li:nth-child(3n)]:lg:border-r-0 [&>li:nth-last-child(-n+2)]:md:border-b-0 [&>li:nth-last-child(-n+3)]:lg:border-b-0 [&>li:first-child]:border-t">
            {related.map((r: Post) => (
              <li key={r.slug}>
                <PostCard post={r} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
