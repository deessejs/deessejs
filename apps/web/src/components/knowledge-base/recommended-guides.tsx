type Guide = { slug: string; title: string; description: string; url: string }

export function RecommendedGuides({ guides }: { guides: readonly Guide[] }) {
  if (guides.length === 0) return null

  return (
    <section className="mt-12 flex flex-col gap-4" aria-labelledby="recommended-guides-heading">
      <h2 id="recommended-guides-heading" className="text-3xl font-semibold tracking-tight">
        Recommended guides
      </h2>
      <ul className="divide-y divide-border border border-border">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <a className="block p-5 hover:bg-accent/30" href={guide.url}>
              <span className="font-medium">{guide.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{guide.description}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
