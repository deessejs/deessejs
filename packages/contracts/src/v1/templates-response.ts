import { z } from "zod"
import { TemplateSummaryV1 } from "./template-summary.js"

/**
 * TemplatesListResponseV1 — the response shape of GET /api/v1/templates.
 *
 * Wrapper around the array so future fields (`meta`, `pagination`, `error`)
 * can be added without breaking the array-of-templates contract that the CLI
 * and apps/web already consume.
 */
export const TemplatesListResponseV1 = z.object({
  templates: z.array(TemplateSummaryV1),
})

export type TemplatesListResponseV1 = z.infer<typeof TemplatesListResponseV1>
