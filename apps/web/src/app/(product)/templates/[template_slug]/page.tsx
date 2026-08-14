import type { Metadata } from "next"
import { notFound } from "next/navigation"

import type { TemplateV1 } from "@workspace/contracts/v1"

import { orpc } from "@/lib/orpc"
import { TemplateDetail } from "@/components/templates/template-detail"

type Params = { template_slug: string }

/**
 * Pre-generate one static page per known slug at build time.
 * Falls back to on-demand rendering for slugs not seen at build
 * (Next.js handles ISR transparently for both).
 *
 * If the fetch fails (no network in CI, backend temporarily down),
 * we return an empty array rather than failing the build. Pages for
 * unknown slugs are then generated on first request via ISR.
 */
export const generateStaticParams = async (): Promise<Params[]> => {
  try {
    const result = await orpc.templates.list()
    return result.templates.map((t) => ({ template_slug: t.slug }))
  } catch {
    return []
  }
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> => {
  const { template_slug } = await params
  let templates: TemplateV1[]
  try {
    const result = await orpc.templates.list()
    templates = result.templates
  } catch {
    return { title: "Template not found" }
  }
  const template = templates.find((t) => t.slug === template_slug)
  if (!template) return { title: "Template not found" }
  return {
    title: template.name,
    description: template.description,
  }
}

/**
 * Detail page at /templates/[template_slug].
 *
 * Single source of truth: same `orpc.templates.list()` call as the
 * index page. The catalog is tiny, so doing a server-side `.find()`
 * is cheaper than maintaining a second endpoint.
 *
 * Build-time resilience: if the fetch fails during page collection,
 * we render a minimal placeholder rather than throwing. The runtime
 * error.tsx boundary still catches errors that surface in production.
 */
const TemplateDetailPage = async ({
  params,
}: {
  params: Promise<Params>
}) => {
  const { template_slug } = await params
  let templates: TemplateV1[]
  try {
    const result = await orpc.templates.list()
    templates = result.templates
  } catch {
    notFound()
  }
  const template = templates.find((t) => t.slug === template_slug)
  if (!template) {
    notFound()
  }
  return (
    <section className="px-6 py-16">
      <TemplateDetail template={template} />
    </section>
  )
}

export default TemplateDetailPage
