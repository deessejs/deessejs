import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { ReleaseGroupView } from "@/components/blog/release-group"
import { SearchDialog } from "@/components/blog/search-dialog"
import { getAllReleases } from "@/lib/blog/releases"
import { groupReleasesByMinor } from "@/lib/blog/types"

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
  const releases = getAllReleases()
  const groups = groupReleasesByMinor(releases)
  const latest = releases[0]

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
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
        </div>
        <SearchDialog />
      </header>

      {latest ? (
        <aside className="mb-10 rounded-xl border border-foreground/30 bg-foreground p-5 text-background sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4" aria-hidden />
                <p className="font-mono text-xs uppercase tracking-widest text-background/70">
                  Latest release
                </p>
              </div>
              <p className="mt-2 font-mono text-sm text-background/70">
                v{latest.version} · {latest.date}
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                {latest.title}
              </h2>
              {latest.description ? (
                <p className="mt-2 text-sm text-background/70">
                  {latest.description}
                </p>
              ) : null}
            </div>
            <Button
              size="sm"
              variant="outline"
              asChild
              className="shrink-0 gap-1.5 border-background/30 bg-background px-4 text-xs font-semibold text-foreground hover:bg-background/90"
            >
              <Link href={latest.url}>
                Read release
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </Button>
          </div>
        </aside>
      ) : null}

      {releases.length === 0 ? (
        <p className="text-muted-foreground">
          No releases yet.
        </p>
      ) : (
        <div>
          {groups.map((group, i) => (
            <ReleaseGroupView
              key={group.label}
              group={group}
              isFirst={i === 0}
            />
          ))}
        </div>
      )}
    </section>
  )
}
