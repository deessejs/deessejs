import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { liveCache, orpc, staticParamsCache } from "@/lib/orpc"
import { TemplateDetail } from "@/components/templates/template-detail"
import { Button } from "@workspace/ui/components/button"

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
    <>
      {/* Hero region — kept inside the GlobalLayout frame so the
          detail page matches the index visually (border-card + xl:
          diagonal stripes). Breadcrumb + H1 + CTAs layout is
          retained from the original detail design because Install /
          View source make sense next to the title. */}
      <div className="border-b border-border py-16 md:py-20 lg:py-24">
        <TemplateDetail template={template} />
      </div>

      {/* Final CTA — 2-col shared-border block. Same shape as the
          homepage's "Use the templates. Or ship with us." block,
          the `(content)` layout's final block, and the templates
          index page, so visitors hit the same conversion lever
          regardless of which surface they arrived on. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
        <div className="flex flex-col gap-4 p-6 lg:p-10">
          <p className="text-label-13 text-muted-foreground">
            Ready to ship?
          </p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
            Browse the registry. Or ship with us.
          </h2>
          <p className="text-copy-16 text-muted-foreground leading-7 max-w-xl [&:not(:first-child)]:mt-0">
            Install the CLI to scaffold a project in under five
            minutes, or talk to our delivery team if you need a
            hand. Same templates, same contracts, same guarantees.
          </p>
        </div>
        <div className="flex flex-col items-stretch justify-center gap-4 p-6 lg:p-10">
          <Button asChild size="lg">
            <Link href="/knowledge-base/guides/install-deessejs-cli">
              Install the CLI
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/templates">Browse the registry</Link>
          </Button>
        </div>
      </div>
    </>
  )
}

export default TemplateDetailPage
