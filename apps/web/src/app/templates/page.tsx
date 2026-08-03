import type { Metadata } from "next"

import { fetchTemplates } from "@/lib/templates-api"
import { TemplateGrid } from "@/components/templates/template-grid"

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Production-ready starters shipped by DeesseJS. Browse the catalog and install with one command.",
}

/**
 * Index page at /templates.
 *
 * RSC: fetches the catalog server-side with ISR (revalidate: 600),
 * parses via @workspace/contracts, and renders a grid of cards.
 *
 * Three states:
 *   - ok + non-empty: render the grid.
 *   - ok + empty: empty-state copy pointing to the CLI.
 *   - error: degrade gracefully to a placeholder rather than throwing.
 *     This keeps the build green when the API is unreachable (CI without
 *     network access, transient outage during deploy). At runtime in
 *     production, the error.tsx client boundary catches errors that do
 *     surface so users see a retry-able state.
 *
 * The catch here is specifically about *build time* collection, where
 * Next.js walks the page tree statically and a thrown error fails the
 * entire build. In production runtime, the error propagates and the
 * error.tsx boundary takes over.
 */
const TemplatesIndexPage = async () => {
  let result: Awaited<ReturnType<typeof fetchTemplates>>
  try {
    result = await fetchTemplates()
  } catch {
    result = { ok: false, error: "Catalog unreachable" }
  }

  if (!result.ok || result.templates.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-heading-32 tracking-tight">Templates</h1>
        <p className="text-copy-16 text-muted-foreground mt-4">
          No templates available right now. Try the CLI:
          <code className="text-copy-14-mono ml-2">deessejs list</code>
        </p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10 flex flex-col gap-3">
        <h1 className="text-heading-40 tracking-tight">Templates</h1>
        <p className="text-copy-16 text-muted-foreground max-w-2xl">
          Production-ready starters shipped by DeesseJS. Click any card to
          view details, or install from the CLI with{" "}
          <code className="text-copy-14-mono">deessejs init &lt;slug&gt;</code>.
        </p>
      </header>
      <TemplateGrid templates={result.templates} />
    </section>
  )
}

export default TemplatesIndexPage
