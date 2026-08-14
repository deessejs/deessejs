import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PostCard } from "@/components/blog/post-card"
import { getAllTags } from "@/lib/blog/types"
import { getPostsByTag } from "@/lib/blog/posts"

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
    title: `Posts tagged "${decoded}"`,
    description: `Articles tagged ${decoded}.`,
  }
}

export default async function TagPage(
  { params }: { params: Promise<Params> },
) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const posts = getPostsByTag(decoded)

  if (posts.length === 0) notFound()

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to blog
      </Link>

      <header className="mb-12 max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Tag
        </p>
        <h1 className="mt-2 text-balance text-4xl font-bold tracking-tighter sm:text-5xl">
          {decoded}
        </h1>
        <p className="mt-4 text-pretty text-lg text-muted-foreground">
          {posts.length} {posts.length === 1 ? "post" : "posts"} tagged with{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground/80">
            {decoded}
          </code>
          .
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  )
}
