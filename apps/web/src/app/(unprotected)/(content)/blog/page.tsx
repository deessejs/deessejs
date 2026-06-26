import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog — DeesseJS",
  description: "Articles, tutorials, and updates from the DeesseJS team.",
}

export default function BlogPage() {
  return (
    <section className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-24">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
          Blog
        </h1>
        <p className="mt-4 text-pretty text-lg text-muted-foreground">
          Articles and tutorials are coming soon. Subscribe to be notified when we publish.
        </p>
      </div>
    </section>
  )
}
