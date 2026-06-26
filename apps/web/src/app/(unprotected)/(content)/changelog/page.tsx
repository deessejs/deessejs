import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Changelog — DeesseJS",
  description: "What's new in DeesseJS.",
}

export default function ChangelogPage() {
  return (
    <section className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-24">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
          Changelog
        </h1>
        <p className="mt-4 text-pretty text-lg text-muted-foreground">
          Release notes are coming soon. Check back for updates on the SaaS template that never sleeps.
        </p>
      </div>
    </section>
  )
}
