import { notFound } from "next/navigation"
import { orpc } from "@/lib/orpc"
export default async function BlockDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}) {
  const p = await params
  const split = p.slug.indexOf("--")
  if (split < 1) {
    notFound()
  }
  let result
  try {
    result = await orpc.blocks.resolve({
      organizationSlug: decodeURIComponent(p.slug.slice(0, split)),
      slug: decodeURIComponent(p.slug.slice(split + 2)),
    })
  } catch {
    notFound()
  }
  const block = result.block
  if (!block || block.category !== decodeURIComponent(p.category)) {
    notFound()
  }
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm text-muted-foreground uppercase">
        {block.category} · Community block
      </p>
      <h1 className="mt-2 text-4xl font-bold">{block.name}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{block.description}</p>
      <a
        className="mt-6 inline-block underline"
        href={`${block.repositoryUrl}/tree/${block.sourceCommit}`}
        rel="noreferrer"
      >
        View pinned GitHub source
      </a>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Block descriptor</h2>
        <pre className="mt-3 overflow-auto rounded-lg border bg-muted p-5 text-sm">
          {JSON.stringify(block.descriptor, null, 2)}
        </pre>
      </section>
    </main>
  )
}
