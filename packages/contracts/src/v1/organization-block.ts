import { z } from "zod"

/** Organization owned block registry record. Technical facts remain in the source descriptor. */
export const OrganizationBlockV1 = z.object({
  id: z.string().uuid(),
  ownerType: z.enum(["organization", "platform"]),
  organizationSlug: z.string().nullable(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  repositoryUrl: z.string().url(),
  subdirectory: z.string(),
  sourceCommit: z.string().regex(/^[0-9a-f]{40}$/),
  descriptor: z.unknown(),
  reviewStatus: z.enum(["draft", "pending", "approved", "rejected"]),
  publicationState: z.enum(["private", "current", "superseded"]),
  submittedAt: z.string().datetime(),
  reviewReason: z.string().nullable(),
})
export type OrganizationBlockV1 = z.infer<typeof OrganizationBlockV1>

export const OrganizationBlockCreateInputV1 = z.object({
  organizationSlug: z.string().min(1),
  slug: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  repositoryUrl: z.string().url().max(2048),
  subdirectory: z.string().trim().default(""),
  category: z.string().trim().min(1).max(64),
  description: z.string().trim().max(10000).default(""),
})

export const OrganizationBlocksListResponseV1 = z.object({
  blocks: z.array(OrganizationBlockV1),
})
export const CommunityBlocksListResponseV1 = z.object({
  blocks: z.array(OrganizationBlockV1),
})
