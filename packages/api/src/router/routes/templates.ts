import { TemplatesListResponseV1 } from "@workspace/contracts/v1"
import { base } from "../procedures/base.js"
import { TEMPLATES } from "../../templates.js"
import { enrich } from "../../core/templates/enrich.js"

/**
 * Public procedure: list the templates in the catalog.
 *
 * Hits GitHub's REST API in parallel for every registry entry (no cache,
 * fail loud). See core/templates/enrich.ts for the failure mode.
 *
 * Consumed by:
 *   - apps/cli  (via @orpc/client)
 *   - apps/web  (via @orpc/client, server-side)
 */
export const list = base.handler(async (): Promise<TemplatesListResponseV1> => {
  const templates = await enrich(TEMPLATES)
  return { templates }
})

export const templatesRouter = {
  list,
}
