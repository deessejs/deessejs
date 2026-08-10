import { TemplatesListResponseV1 } from "@workspace/contracts/v1"

import {
  TEMPLATES_REVALIDATE_SECONDS,
  TEMPLATES_URL,
} from "./templates-config"

export type Template = TemplatesListResponseV1["templates"][number]

export type FetchTemplatesResult =
  | { ok: true; templates: Template[] }
  | { ok: false; error: string }

/**
 * Body sent to a no-input oRPC procedure. The numeric key (`"0"`) is the
 * procedure's input slot; with no inputs we send `null`. The server
 * unwraps this and runs the named procedure.
 */
const ORPC_NO_INPUT_BODY = JSON.stringify({ "0": { json: null, meta: [] } })

/**
 * Fetch the templates registry from the backend.
 *
 * Runs as a React Server Component: `cache: "force-cache"` with a
 * revalidation window (ISR). The browser never sees this call.
 *
 * The endpoint is an oRPC procedure (`templates.list`). The server wraps
 * the response in `{ result: { data: ... } }`, which we unwrap here
 * before validating against the public Zod contract.
 *
 * Why ISR + tags instead of plain SSR:
 *   - The catalog changes rarely. SSR per request is wasted work.
 *   - `revalidate: 600` matches the server's `Cache-Control: max-age=600`
 *     on `/cli-version`, so the TTL is consistent across surfaces.
 *   - `tags: ["templates"]` allows future on-demand revalidation via
 *     `revalidateTag("templates")` without changing this code.
 *
 * Why parse via the shared Zod schema:
 *   - `apps/web` is now an honest third consumer of `@workspace/contracts`.
 *     A schema mismatch surfaces as a thrown error here, caught by the
 *     page's `error.tsx`, instead of silently rendering broken cards.
 */
export const fetchTemplates = async (): Promise<FetchTemplatesResult> => {
  try {
    const res = await fetch(TEMPLATES_URL, {
      method: "POST",
      body: ORPC_NO_INPUT_BODY,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      next: {
        revalidate: TEMPLATES_REVALIDATE_SECONDS,
        tags: ["templates"],
      },
    })

    if (!res.ok) {
      return {
        ok: false,
        error: `Templates endpoint returned HTTP ${res.status}`,
      }
    }

    const envelope: unknown = await res.json()
    const data =
      envelope !== null &&
      typeof envelope === "object" &&
      "result" in envelope &&
      envelope.result !== null &&
      typeof envelope.result === "object" &&
      "data" in envelope.result
        ? (envelope.result as { data: unknown }).data
        : envelope

    const parsed = TemplatesListResponseV1.safeParse(data)
    if (!parsed.success) {
      return {
        ok: false,
        error: `Templates response failed schema validation`,
      }
    }

    return { ok: true, templates: parsed.data.templates }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
