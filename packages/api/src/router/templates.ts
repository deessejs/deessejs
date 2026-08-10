import { TemplatesListResponseV1 } from "@workspace/contracts/v1"
import { base } from "./context.js"
import { TEMPLATES } from "../templates.js"
import { fetchTemplates } from "../services/templates-fetcher.js"

/**
 * Public procedure: list the templates in the catalog.
 *
 * Hits GitHub's REST API in parallel for every registry entry (no cache,
 * fail loud). See services/templates-fetcher.ts for the failure mode.
 *
 * Consumed by:
 *   - apps/cli  (via @orpc/client)
 *   - apps/web  (via @orpc/client, server-side)
 */
export const listTemplates = base.handler(async (): Promise<TemplatesListResponseV1> => {
  const templates = await fetchTemplates(TEMPLATES)
  return { templates }
})

export const templatesRouter = {
  list: listTemplates,
}
