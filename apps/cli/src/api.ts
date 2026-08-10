import { TemplatesListResponseV1 } from "@workspace/contracts/v1"

import { USER_AGENT } from "./constants.js"
import { networkError, parseError } from "./errors.js"
import { fetchWithRetry } from "./fetch-with-retry.js"
import { maybeWarnAboutOutdatedCli } from "./version-check.js"

export type Template = TemplatesListResponseV1["templates"][number]

export type FetchOptions = {
  /** Skip the version probe. Used by tests and by the version probe itself. */
  skipVersionCheck?: boolean
}

/**
 * oRPC request body for a no-input procedure. The numeric key (`"0"`) is
 * the procedure's input slot; with no inputs we send `null`. The server
 * unwraps this and runs the named procedure.
 */
const ORPC_NO_INPUT_BODY = JSON.stringify({ "0": { json: null, meta: [] } })

/**
 * Unwrap the oRPC envelope and return the procedure's typed result.
 *
 * The server returns `{ result: { data: ... } }`. Anything else (a 4xx
 * error envelope, a JSON body that doesn't match) is left as-is so the
 * downstream Zod parse surfaces the mismatch as `parse_error`.
 */
const unwrapOrpc = (envelope: unknown): unknown => {
  if (
    envelope !== null &&
    typeof envelope === "object" &&
    "result" in envelope &&
    envelope.result !== null &&
    typeof envelope.result === "object" &&
    "data" in envelope.result
  ) {
    return (envelope.result as { data: unknown }).data
  }
  return envelope
}

/**
 * Fetch the templates registry.
 *
 * Flow:
 *   1. (If not skipVersionCheck) probe /cli-version and warn if outdated.
 *      Failure here is silent — version check is best-effort.
 *   2. POST to the oRPC endpoint with the standard no-input body.
 *      Retry + backoff are handled by fetchWithRetry.
 *   3. Unwrap the oRPC envelope, validate against the shared Zod
 *      contract, return the templates list.
 *
 * Why we don't use @orpc/client + RPCLink:
 *   - The CLI keeps a sophisticated retry/backoff/429-aware fetch via
 *     fetchWithRetry. Wrapping it into a global `fetch` shape to feed
 *     RPCLink adds friction without much gain: we still parse the body
 *     through Zod, we still throw the same CliError codes, and the
 *     unwrap is one short helper.
 *   - We keep direct fetch + unwrap. Same wire format, same retry
 *     semantics, simpler code.
 */
export const fetchTemplates = async (
  apiUrl: string,
  options: FetchOptions = {},
): Promise<Template[]> => {
  if (!options.skipVersionCheck) {
    await maybeWarnAboutOutdatedCli(apiUrl)
  }

  let res: Awaited<ReturnType<typeof fetchWithRetry>>
  try {
    res = await fetchWithRetry({
      apiUrl,
      method: "POST",
      body: ORPC_NO_INPUT_BODY,
      headers: {
        "user-agent": USER_AGENT,
        accept: "application/json",
        "content-type": "application/json",
      },
    })
  } catch (e) {
    throw networkError(
      `fetch failed: ${e instanceof Error ? e.message : String(e)}`,
    )
  }

  if (res.status < 200 || res.status >= 300) {
    throw networkError(`endpoint returned HTTP ${res.status}`)
  }

  let envelope: unknown
  try {
    envelope = JSON.parse(res.bodyText)
  } catch (e) {
    throw parseError(
      `endpoint returned non-JSON body: ${e instanceof Error ? e.message : String(e)}`,
    )
  }

  const result = TemplatesListResponseV1.safeParse(unwrapOrpc(envelope))
  if (!result.success) {
    throw parseError(
      `response shape mismatch: ${result.error.issues
        .map((i) => `${i.path.join(".")} (${i.code})`)
        .join(", ")}`,
    )
  }

  return result.data.templates
}
