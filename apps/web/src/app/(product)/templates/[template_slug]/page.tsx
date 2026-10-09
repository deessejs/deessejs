import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"

import {
  TEMPLATES_WITH_READMES,
  findTemplateWithReadme,
} from "@workspace/api/templates-catalog-with-readmes"
import { Button } from "@workspace/ui/components/button"

import { TemplateDetail } from "@/components/templates/template-detail"

type Params = { template_slug: string }

/**
 * `/templates/[template_slug]` — static detail page.
 *
 * Source of truth:
 *   The catalog (`@workspace/api/templates-catalog-with-readmes`)
 *   bundles the registry with versioned README snapshots from
 *   `packages/api/src/templates/readmes/{slug}.md`. No oRPC, no
 *   GitHub fetch at request time. The README is read directly
 *   from the snapshot bundled in this package — a transient
 *   upstream outage cannot erase it.
 *
 * `dynamicParams = false` rejects everything else with a real
 * 404; we still call `notFound()` from the page body as a belt-
 * and-braces guard.
 */

export const dynamicParams = false

export const generateStaticParams = async (): Promise<Params[]> => {
  return TEMPLATES_WITH_READMES.map((t) => ({ template_slug: t.slug }))
}

const SITE_URL = "https://deessejs.com"

export const generateMetadata = async ({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> => {
  const { template_slug } = await params
  const template = findTemplateWithReadme(template_slug)
  if (!template) {
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

const TemplateDetailPage = async ({
  params,
}: {
  params: Promise<Params>
}) => {
  const { template_slug } = await params
  const template = findTemplateWithReadme(template_slug)
  if (!template) notFound()

  return (
    <>
      <div className="border-b border-border py-16 md:py-20 lg:py-24">
        <TemplateDetail template={template} />
      </div>

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
