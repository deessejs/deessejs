import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Separator } from "@workspace/ui/components/separator"
import { allReleases } from "content-collections"
import { PostCard } from "@/components/blog/post-card"
import { Prose } from "@/components/blog/prose"
import { ReleaseMeta } from "@/components/blog/release-meta"
import { MdxRenderer } from "@/components/blog/mdx-renderer"
import {
  getAdjacentReleases,
  getRelatedBlogPosts,
  getReleaseBySlug,
} from "@/lib/blog/releases"

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
      title: `${release.version} — ${release.title}`,
      description: release.description,
      publishedTime: release.date,
      url: release.url,
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
    <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
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
        <div className="mt-6">
          <ReleaseMeta release={release} />
        </div>
      </header>

      <Prose className="mt-10">
        <MdxRenderer code={release.mdxCode} />
      </Prose>

      {(prev || next) && (
        <>
          <Separator className="my-12" />
          <nav className="grid gap-4 sm:grid-cols-2" aria-label="Release navigation">
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
          <div className="grid gap-6 md:grid-cols-2">
            {relatedPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
