import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { TemplateDetail } from "@/components/templates/template-detail"
import { liveCache, orpc, staticParamsCache } from "@/lib/orpc"
import type { CommunityTemplateV1 } from "@workspace/contracts/v1"

type Params = { organization_slug: string; template_slug: string }

async function getCommunityTemplate(
  organizationSlug: string,
  templateSlug: string,
  cache = liveCache
): Promise<CommunityTemplateV1 | undefined> {
  const { templates } = await orpc.templates.community.list(undefined, cache)
  return templates.find(
    (template) =>
      template.organizationSlug === organizationSlug &&
      template.templateSlug === templateSlug
  )
}

export const generateStaticParams = async (): Promise<Params[]> => {
  try {
    const { templates } = await orpc.templates.community.list(
      undefined,
      staticParamsCache
    )
    return templates.map((template) => ({
      organization_slug: template.organizationSlug,
      template_slug: template.templateSlug,
    }))
  } catch {
    return []
  }
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> => {
  const { organization_slug, template_slug } = await params
  try {
    const template = await getCommunityTemplate(
      organization_slug,
      template_slug
    )
    return template
      ? {
          title: `${template.name} by ${template.organizationName}`,
          description: template.description,
        }
      : { title: "Template not found" }
  } catch {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return { title: "Template not found" }
    }
    throw new Error("Failed to load community template metadata")
  }
}

export default async function CommunityTemplateDetailPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { organization_slug, template_slug } = await params
  let template
  try {
    template = await getCommunityTemplate(organization_slug, template_slug)
  } catch {
    if (process.env.NEXT_PHASE === "phase-production-build") notFound()
    throw new Error("Failed to load community template")
  }

  if (!template) notFound()

  return (
    <div className="border-b border-border py-16 md:py-20 lg:py-24">
      <TemplateDetail template={template} />
    </div>
  )
}
