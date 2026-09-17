import type { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"
import { ReleaseTimeline } from "@/components/blog/release-group"
import { getAllReleases } from "@/lib/blog/releases"
import { getAllTags, sortReleasesByDateDesc } from "@/lib/blog/types"

export const metadata: Metadata = {
  title: "Changelog",
  description: "Public release notes. Subscribe via RSS.",
  alternates: {
    canonical: "/changelog",
    types: {
      "application/rss+xml": "/changelog/feed.xml",
    },
  },
}

export default function ChangelogPage() {
  const releases = sortReleasesByDateDesc(getAllReleases())
  const tags = getAllTags()

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-balance text-4xl font-bold tracking-tighter sm:text-5xl">
          Changelog
        </h1>
        <p className="mt-2 text-pretty text-lg text-muted-foreground">
          Public release notes. Subscribe via{" "}
          <a
            href="/changelog/feed.xml"
            className="underline underline-offset-4 hover:text-foreground"
          >
            RSS
          </a>
          .
        </p>
        {tags.length > 0 ? (
          <nav
            aria-label="Related blog topics"
            className="mt-6 flex flex-wrap items-center gap-2"
          >
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
          </nav>
        ) : null}
      </header>

      {releases.length === 0 ? (
        <p className="text-muted-foreground">No releases yet.</p>
      ) : (
        <ReleaseTimeline releases={releases} />
      )}
    </section>
  )
}
