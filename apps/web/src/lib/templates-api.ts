import { ORPCError } from "@orpc/client"
import { TemplatesListResponseV1 } from "@workspace/contracts/v1"

import { orpc } from "./orpc"

export type Template = TemplatesListResponseV1["templates"][number]

export type FetchTemplatesResult =
  | { ok: true; templates: Template[] }
  | { ok: false; error: string }

/**
 * Fetch the templates registry from the backend.
 *
 * Runs as a React Server Component. The typed `orpc` client (see
 * ./orpc.ts) takes care of:
 *   - the oRPC envelope (`{ "0": { json: null, meta: [] } }`)
 *   - the wire format (POST + `content-type: application/json`)
 *   - the typed result and `ORPCError` decoding
 *   - ISR directives (`next: { revalidate, tags }`) on the underlying
 *     `fetch`, honored by Next.js App Router
 *
 * Why the typed client instead of direct fetch + unwrap:
 *   - One source of truth for the wire shape (`appRouter`).
 *   - `ORPCError.code` is mapped to a typed result instead of a string.
 *   - No risk of unwrap drift if the oRPC envelope shape evolves.
 *
 * The function signature stays stable so consumers in
 * `apps/web/src/components/templates/` and the `/templates` page do
 * not change.
 */
export const fetchTemplates = async (): Promise<FetchTemplatesResult> => {
  try {
    const result = await orpc.templates.list()
    return { ok: true, templates: result.templates }
  } catch (e) {
    if (e instanceof ORPCError) {
      return {
        ok: false,
        error: `Templates endpoint returned ${e.code} (status ${e.status})`,
      }
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
