import { z } from "zod"
import { TemplateV1 } from "./template.js"

/** Public list projection. Full README content is available from detail procedures. */
export const TemplateSummaryV1 = TemplateV1.omit({ readme: true })
export type TemplateSummaryV1 = z.infer<typeof TemplateSummaryV1>
