import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { TEMPLATES } from "@workspace/api/templates-catalog"
import { Button } from "@workspace/ui/components/button"

import { TemplateDetail } from "@/components/templates/template-detail"

type Params = { template_slug: string }

/**
 * `/templates/[template_slug]` — static detail page.
 *
 * Source of truth:
 *   The catalog (`@workspace/api/templates-catalog`) is read at
 *   build time. `generateStaticParams` enumerates every slug,
 *   `dynamicParams = false` rejects everything else with a real
 *   404, and `generateMetadata` reads the same static snapshot as
 *   the page body. The detail page never makes a network call to
 *   render.
 *
 * This is the inverse of the previous design, where the detail
 * page called the oRPC `templates.list` endpoint and resolved a
 * single template by `.find(...)`. That path:
 *   - put `generateMetadata` on the runtime,
 *   - funneled all metadata through the same `liveCache` directive
 *     the index page used,
 *   - depended on the GitHub enrichment pipeline,
 *   - swallowed upstream failures as "Template not found",
 *   - and exposed the same status-loss shape as the index page.
 *
 * Slug drift:
 *   `generateStaticParams` is the build-time guarantee. A slug
 *   added to the registry surfaces here automatically on the next
 *   build. A slug present here but absent from the registry never
 *   happens because the registry is the only source.
 *
 * `dynamicParams = false`:
 *   Any URL like `/templates/nonexistent-slug` returns a real 404
 *   from Next.js, not the previous "Template not found" title
 *   served as HTTP 200. We use `notFound()` from the page body
 *   rather than rely solely on `dynamicParams` so any future
 *   refactor that re-enables dynamic params still produces a 404.
 */

export const dynamicParams = false

export const generateStaticParams = async (): Promise<Params[]> => {
  return TEMPLATES.map((t) => ({ template_slug: t.slug }))
}

const SITE_URL = "https://deessejs.com"

export const generateMetadata = async ({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> => {
  const { template_slug } = await params
  const template = TEMPLATES.find((t) => t.slug === template_slug)
  if (!template) {
    // `generateStaticParams` and `dynamicParams = false` should
    // prevent this from ever being reached. If it is reached
    // (e.g. ISR or a future refactor), we still return a 404
    // metadata shape so search engines de-rank the URL.
    return {
      title: "Template not found",
      robots: { index: false, follow: false },
    }
  }
  const canonicalPath = `/templates/${template.slug}`
  return {
    title: template.name,
    description: template.description,
    alternates: {
      canonical: `${SITE_URL}${canonicalPath}`,
    },
    openGraph: {
      title: `${template.name} — DeesseJS Templates`,
      description: template.description,
      url: `${SITE_URL}${canonicalPath}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${template.name} — DeesseJS Templates`,
      description: template.description,
    },
  }
}

/**
 * Page body — pure render from the static catalog.
 *
 * No oRPC call, no GitHub fetch, no `liveCache`, no try/catch.
 * If `template_slug` is unknown we still call `notFound()` so
 * even after a regression that re-enables dynamic params the
 * visitor hits a proper 404 instead of a header-only page with
 * empty state.
 */
const TemplateDetailPage = async ({
  params,
}: {
  params: Promise<Params>
}) => {
  const { template_slug } = await params
  const template = TEMPLATES.find((t) => t.slug === template_slug)
  if (!template) notFound()

  return (
    <>
      {/* Hero region — kept inside the GlobalLayout frame so the
          detail page matches the index visually. The TemplateDetail
          component is unchanged from the previous static shape. */}
      <div className="border-b border-border py-16 md:py-20 lg:py-24">
        <TemplateDetail template={template} />
      </div>

      {/* Final CTA — 2-col shared-border block. Same shape as the
          homepage's "Use the templates. Or ship with us." block,
          the `(content)` layout's final block, and the templates
          index page. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
        <FinalCtaCopyColumn />
        <FinalCtaActionsColumn />
      </div>
    </>
  )
}

export default TemplateDetailPage

function FinalCtaCopyColumn() {
  return (
    <div className="flex flex-col gap-4 p-6 lg:p-10">
      <p className="text-label-13 text-muted-foreground">Ready to ship?</p>
      <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
        Browse the registry. Or ship with us.
      </h2>
      <p className="text-copy-16 text-muted-foreground leading-7 max-w-xl [&:not(:first-child)]:mt-0">
        Install the CLI to scaffold a project in under five minutes, or talk to
        our delivery team if you need a hand. Same templates, same contracts,
        same guarantees.
      </p>
    </div>
  )
}

function FinalCtaActionsColumn() {
  return (
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
  )
}
