import { z } from "zod"
import { TemplateSummaryV1 } from "./template-summary.js"

export const CommunityTemplateSummaryV1 = TemplateSummaryV1.extend({
  community: z.literal(true),
  organizationSlug: z.string().min(1),
  organizationName: z.string().min(1),
  templateSlug: z.string().min(1),
  sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
})
export type CommunityTemplateSummaryV1 = z.infer<
  typeof CommunityTemplateSummaryV1
>
