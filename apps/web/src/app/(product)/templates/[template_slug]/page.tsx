import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  TEMPLATES_WITH_READMES,
  findTemplateWithReadme,
} from "@workspace/api/templates-catalog-with-readmes"

import { FinalCta } from "@/components/pages/_shared/final-cta"
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
 *
 * Closing block:
 *   The page closes with the shared `<FinalCta>` shell from
 *   `@/components/pages/_shared/final-cta`. Every public page
 *   uses that same shell so the closing rhythm stays uniform;
 *   page-specific copy flows in as props. Previously this page
 *   had its own `FinalCtaCopyColumn` + `FinalCtaActionsColumn`
 *   pair inline, duplicating the shell's two columns.
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

      <FinalCta
        eyebrow="Ready to ship?"
        title="Browse the registry. Or ship with us."
        body="Install the CLI to scaffold a project in under five minutes, or talk to our delivery team if you need a hand. Same templates, same contracts, same guarantees."
        actions={[
          {
            label: "Install the CLI",
            href: "/knowledge-base/guides/install-deessejs-cli",
            withArrow: true,
          },
          {
            label: "Browse the registry",
            href: "/templates",
            variant: "outline",
          },
        ]}
      />
    </>
  )
}

export default TemplateDetailPage
