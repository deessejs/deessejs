import { z } from "zod"

/**
 * Organization template management wire contracts used by the authenticated
 * API procedures and the CLI. Ownership and publication are separate fields.
 */
export const OrganizationTemplateV1 = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  owner: z.string(),
  repo: z.string(),
  category: z.string(),
  labels: z.array(z.string()),
  license: z.string(),
  canonicalUrl: z.string().url(),
  repositoryName: z.string(),
  stars: z.number().int().nonnegative().nullable(),
  fetchedAt: z.string().datetime(),
  currentlyPublished: z.boolean(),
  publication: z
    .object({
      reviewStatus: z.enum(["pending", "approved", "rejected", "withdrawn"]),
      publicationState: z.enum([
        "unpublished",
        "current",
        "superseded",
        "removed",
      ]),
      submittedAt: z.string().datetime(),
      reviewReason: z.string().nullable(),
    })
    .nullable(),
})
export type OrganizationTemplateV1 = z.infer<typeof OrganizationTemplateV1>

export const OrganizationTemplatesListResponseV1 = z.object({
  templates: z.array(OrganizationTemplateV1),
})
export type OrganizationTemplatesListResponseV1 = z.infer<
  typeof OrganizationTemplatesListResponseV1
>

export const OrganizationTemplateCategoryV1 = z.enum([
  "saas",
  "ai",
  "landing",
  "desktop",
  "docs",
  "marketing",
  "content",
  "library",
  "ai-agent",
])
export type OrganizationTemplateCategoryV1 = z.infer<
  typeof OrganizationTemplateCategoryV1
>

export const OrganizationTemplateCreateInputV1 = z.object({
  organizationSlug: z.string().min(1),
  slug: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  repositoryUrl: z.string().trim().min(1).max(2048),
  descriptionOverride: z.string().trim().max(10000).nullable().optional(),
  category: OrganizationTemplateCategoryV1,
  labels: z.array(z.string().trim().min(1).max(64)).max(50),
  licenseFallback: z.string().trim().max(128).nullable().optional(),
})
export type OrganizationTemplateCreateInputV1 = z.infer<
  typeof OrganizationTemplateCreateInputV1
>
