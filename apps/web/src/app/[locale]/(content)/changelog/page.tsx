import type { Metadata } from "next"
import { FlickeringGrid } from "@/app/[locale]/(marketing)/_components/flickering-grid"
import { ReleaseTimeline } from "@/components/blog/release-group"
import { getAllReleases } from "@/lib/blog/releases"
import { sortReleasesByDateDesc } from "@/lib/blog/types"

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
            Changelog
          </p>
          <h1 className="text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56">
            Public release notes.
          </h1>
          <p className="max-w-2xl text-copy-18 leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
            Subscribe via{" "}
            <a
              href="/changelog/feed.xml"
              className="underline underline-offset-4 hover:text-foreground"
            >
              RSS
            </a>
            , or browse the latest releases by version and date.
          </p>
        </div>
      </header>

      {releases.length === 0 ? (
        <p className="text-muted-foreground px-6 py-16 text-center">
          No releases yet.
        </p>
      ) : (
        <ReleaseTimeline releases={releases} />
      )}
    </section>
  )
}
