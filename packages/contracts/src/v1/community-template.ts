import { z } from "zod"
import { TemplateV1 } from "./template.js"

export const CommunityTemplateV1 = TemplateV1.extend({
  community: z.literal(true),
  organizationSlug: z.string().min(1),
  organizationName: z.string().min(1),
  templateSlug: z.string().min(1),
  sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
})

export type CommunityTemplateV1 = z.infer<typeof CommunityTemplateV1>
