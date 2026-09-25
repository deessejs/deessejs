import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Separator } from "@workspace/ui/components/separator"
import { WEB_URL } from "@/lib/urls"
import { allReleases } from "content-collections"
import { PostCard } from "@/components/blog/post-card"
import { MdxRenderer } from "@/components/blog/mdx-renderer"
import { ReleaseMeta } from "@/components/blog/release-meta"
import { TableOfContents } from "@/components/blog/table-of-contents"
import {
  getAdjacentReleases,
  getRelatedBlogPosts,
  getReleaseBySlug,
} from "@/lib/blog/releases"
import type { Post } from "@/lib/blog/types"
import { ORG_ID } from "@/lib/seo/organization"
import { jsonLdScript } from "@/lib/json-ld"

type Params = { slug: string }

export function generateStaticParams(): Array<Params> {
  return allReleases.map((release) => ({ slug: release.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params
  const release = getReleaseBySlug(slug)
  if (!release) return {}
  return {
    title: `${release.version} — ${release.title}`,
    description: release.description,
    alternates: { canonical: release.url },
    openGraph: {
      type: "article",
      siteName: "DeesseJS",
      locale: "en_US",
      title: `${release.version} — ${release.title}`,
      description: release.description,
      publishedTime: release.date,
      url: release.url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${release.version} — ${release.title}`,
      description: release.description,
    },
  }
}

export default async function ReleasePage(
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params
  const release = getReleaseBySlug(slug)
  if (!release) notFound()

  const relatedPosts = getRelatedBlogPosts(release)
  const { prev, next } = getAdjacentReleases(slug)

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${release.version} — ${release.title}`,
            description: release.description,
            // `version` is semver (already enforced by the Zod schema),
            // so we can surface it as a schema.org `version` field.
            version: release.version,
            datePublished: `${release.date}T00:00:00.000Z`,
            inLanguage: "en",
            keywords: release.categories,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${WEB_URL}${release.url}`,
            },
            url: `${WEB_URL}${release.url}`,
            publisher: { "@id": ORG_ID },
            author: {
              "@type": "Organization",
              name: "DeesseJS",
              "@id": ORG_ID,
            },
          }),
        }}
      />

      <Link
        href="/changelog"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to changelog
      </Link>

      <header className="mb-10">
        <h1 className="text-balance text-4xl font-bold tracking-tighter sm:text-5xl">
          {release.title}
        </h1>
        <p className="mt-4 text-pretty text-lg text-muted-foreground">
          {release.description}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <ReleaseMeta release={release} />
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[1fr_180px] lg:gap-12">
        <div className="min-w-0">
          <MdxRenderer id="article-prose" className="mt-10" code={release.mdxCode} />
        </div>
        <aside className="hidden lg:block">
          <TableOfContents targetId="article-prose" />
        </aside>
      </div>

      {(prev || next) && (
        <>
          <Separator className="my-12" />
          <nav
            className="grid gap-4 sm:grid-cols-2"
            aria-label="Release navigation"
          >
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
                  {prev.version} — {prev.title}
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
                  {next.version} — {next.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </>
      )}

      {relatedPosts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">
            Related reading
          </h2>
          <ul className="m-0 grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 lg:grid-cols-3 [&>li]:border-r [&>li]:border-b [&>li]:border-border [&>li:nth-child(2n)]:md:border-r-0 [&>li:nth-child(3n)]:lg:border-r-0 [&>li:nth-last-child(-n+2)]:md:border-b-0 [&>li:nth-last-child(-n+3)]:lg:border-b-0 [&>li:first-child]:border-t">
            {relatedPosts.map((post: Post) => (
              <li key={post.slug}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
