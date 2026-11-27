import { z } from "zod"

/** Read projection for a project visible to a member of its owning organization. */
export const OrganizationProjectSummaryV1 = z.object({
  id: z.string().uuid(),
  name: z.string(),
  repositoryId: z.string(),
  repositoryFullName: z.string(),
  repositoryUrl: z.string().url(),
  isPrivate: z.boolean(),
  defaultBranch: z.string(),
  configurationPath: z.string(),
  status: z.enum([
    "valid",
    "needs_revalidation",
    "configuration_invalid",
    "access_unavailable",
    "check_failed",
  ]),
  lastCheckedAt: z.string().datetime().nullable(),
})
export type OrganizationProjectSummaryV1 = z.infer<
  typeof OrganizationProjectSummaryV1
>

export const OrganizationProjectV1 = OrganizationProjectSummaryV1.extend({
  commitSha: z.string().nullable(),
  formatVersion: z.number().int().nullable(),
  pathCount: z.number().int().nullable(),
  aliasCount: z.number().int().nullable(),
})
export type OrganizationProjectV1 = z.infer<typeof OrganizationProjectV1>

export const OrganizationProjectsListResponseV1 = z.object({
  projects: z.array(OrganizationProjectSummaryV1),
  pagination: z
    .object({
      page: z.number().int().positive(),
      pageSize: z.number().int().positive(),
      hasMore: z.boolean(),
    })
    .optional(),
})
export type OrganizationProjectsListResponseV1 = z.infer<
  typeof OrganizationProjectsListResponseV1
>

export const OrganizationProjectDetailResponseV1 = z.object({
  project: OrganizationProjectV1,
})
export type OrganizationProjectDetailResponseV1 = z.infer<
  typeof OrganizationProjectDetailResponseV1
>
