import { z } from "zod"
import { CommunityTemplateV1 } from "./community-template.js"

export const CommunityTemplatesListResponseV1 = z.object({
  templates: z.array(CommunityTemplateV1),
})

export type CommunityTemplatesListResponseV1 = z.infer<
  typeof CommunityTemplatesListResponseV1
>
