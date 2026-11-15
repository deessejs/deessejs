import { z } from "zod"
import { CommunityTemplateV1 } from "./community-template.js"
import { CommunityTemplateSummaryV1 } from "./community-template-summary.js"

export const CommunityTemplatesListResponseV1 = z.object({
  templates: z.array(CommunityTemplateV1),
})

export type CommunityTemplatesListResponseV1 = z.infer<
  typeof CommunityTemplatesListResponseV1
>

export const CommunityTemplatesSummaryResponseV1 = z.object({
  templates: z.array(CommunityTemplateSummaryV1),
})
export type CommunityTemplatesSummaryResponseV1 = z.infer<
  typeof CommunityTemplatesSummaryResponseV1
>
