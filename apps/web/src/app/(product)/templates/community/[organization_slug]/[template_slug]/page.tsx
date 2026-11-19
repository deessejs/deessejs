import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { TemplateDetail } from "@/components/templates/template-detail"
import {
  getCommunityTemplateCatalog,
  getCommunityTemplateDetail,
} from "@/lib/template-catalog-cache"

type Params = { organization_slug: string; template_slug: string }

export const generateStaticParams = async (): Promise<Params[]> => {
  try {
    const { templates } = await getCommunityTemplateCatalog()
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
    const template = await getCommunityTemplateDetail(
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
    template = await getCommunityTemplateDetail(
      organization_slug,
      template_slug
    )
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
