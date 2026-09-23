import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { liveCache, orpc, staticParamsCache } from "@/lib/orpc"
import { TemplateDetail } from "@/components/templates/template-detail"

type Params = { template_slug: string }

/**
 * Pre-generate one static page per known slug at build time.
 * Falls back to on-demand rendering for slugs not seen at build
 * (Next.js handles ISR transparently for both).
 *
 * Uses `staticParamsCache` (revalidate: 600, tag `templates:static`)
 * so the slug list is cached across builds but cannot collide with
 * the runtime cache. If the fetch fails (no network in CI, backend
 * temporarily down), we return an empty array rather than failing
 * the build; missing slugs are generated on demand via ISR.
 */
export const generateStaticParams = async (): Promise<Params[]> => {
  try {
    const result = await orpc.templates.list(undefined, staticParamsCache)
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
  try {
    const result = await orpc.templates.list(undefined, liveCache)
    const template = result.templates.find((t) => t.slug === template_slug)
    if (!template) return { title: "Template not found" }
    return {
      title: template.name,
      description: template.description,
    }
  } catch {
    // Build-time fallback: when the build worker has no network
    // access to the API, fall back to the existing "Template not
    // found" title so the build still ships. Production runtime
    // always re-throws so the segment's error.tsx renders. Issue #81.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return { title: "Template not found" }
    }
    throw new Error("Failed to load template metadata")
  }
}

/**
 * Detail page at /templates/[template_slug].
 *
 * Single source of truth: same `orpc.templates.list()` call as the
 * index page. The catalog is tiny, so doing a server-side `.find()`
 * is cheaper than maintaining a second endpoint.
 *
 * Uses `liveCache` (revalidate: 0, tag `templates:live`) so a
 * transient failure cannot poison the Next.js data cache. On a
 * runtime error the request propagates to the segment's `error.tsx`
 * boundary. A fetch error is NOT a 404 — do NOT `notFound()` in the
 * catch. During `next build` we fall back to `notFound()` so the
 * build still ships when the API is unreachable.
 */
const TemplateDetailPage = async ({
  params,
}: {
  params: Promise<Params>
}) => {
  const { template_slug } = await params
  let template
  try {
    const result = await orpc.templates.list(undefined, liveCache)
    template = result.templates.find((t) => t.slug === template_slug)
  } catch {
    // Build-time fallback: a failed fetch during prerender becomes
    // a 404 (the slug cannot be confirmed). Production runtime
    // always re-throws so error.tsx renders. Issue #81.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      notFound()
    }
    throw new Error("Failed to load template")
  }
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
