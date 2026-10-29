import type { CommunityTemplateV1, TemplateV1 } from "@workspace/contracts/v1"

export type CatalogTemplate = TemplateV1 | CommunityTemplateV1

export function isCommunityTemplate(
  template: CatalogTemplate
): template is CommunityTemplateV1 {
  return "community" in template && template.community
}

export function templateDetailHref(template: CatalogTemplate): string {
  if (isCommunityTemplate(template)) {
    return `/templates/community/${encodeURIComponent(template.organizationSlug)}/${encodeURIComponent(template.templateSlug)}`
  }
  return `/templates/${encodeURIComponent(template.slug)}`
}
