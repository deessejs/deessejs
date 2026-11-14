import { z } from "zod"
import { CommunityTemplateSummaryV1 } from "./community-template-summary.js"

export const CommunityTemplatesListResponseV1 = z.object({
  templates: z.array(CommunityTemplateSummaryV1),
})

export type CommunityTemplatesListResponseV1 = z.infer<
  typeof CommunityTemplatesListResponseV1
>
