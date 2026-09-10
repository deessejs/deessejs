import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { allAuthors, allPosts } from "content-collections"
import { PostCard } from "@/components/blog/post-card"
import { buildPersonJsonLd } from "@/lib/seo/person-jsonld"

type Params = { handle: string }

export function generateStaticParams(): Array<Params> {
  return allAuthors.map((author) => ({ handle: author.handle }))
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { handle } = await params
  const author = allAuthors.find((a) => a.handle === handle)
  if (!author) return {}
  const description = author.bio ?? `Articles by ${author.name}.`
  return {
    title: author.name,
    description,
    alternates: {
      canonical: `/blog/author/${encodeURIComponent(handle)}`,
    },
    openGraph: {
      type: "profile",
      siteName: "DeesseJS",
      locale: "en_US",
      title: author.name,
      description,
      url: `/blog/author/${encodeURIComponent(handle)}`,
      ...(author.avatar ? { images: [{ url: author.avatar }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: author.name,
      description,
    },
  }
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { handle } = await params
  const author = allAuthors.find((a) => a.handle === handle)
  if (!author) notFound()

  const posts = allPosts
    .filter((p) => p.authors.some((a) => a.handle === handle))
    .sort((a, b) => b.date.localeCompare(a.date))

  const initials = author.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildPersonJsonLd(author)),
        }}
      />
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to blog
      </Link>

      <header className="mb-12 flex items-start gap-5">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-lg font-semibold text-foreground">
          {initials || author.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Author
          </p>
          <h1 className="mt-1 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {author.name}
          </h1>
          {author.bio ? (
            <p className="mt-3 max-w-2xl text-pretty text-base text-muted-foreground">
              {author.bio}
            </p>
          ) : null}
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </p>
        </div>
      </header>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No articles yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </section>
  )
}
