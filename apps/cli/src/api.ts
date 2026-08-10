import { TemplatesListResponseV1 } from "@workspace/contracts/v1"

import { USER_AGENT } from "./constants.js"
import { networkError, parseError } from "./errors.js"
import { fetchWithRetry } from "./fetch-with-retry.js"
import { maybeWarnAboutOutdatedCli } from "./version-check.js"

export type Template = TemplatesListResponseV1["templates"][number]

export type FetchOptions = {
  /** Skip the version probe. Used by tests and by the version probe itself. */
  skipVersionCheck?: boolean
  /**
   * Maximum number of retry attempts for `fetchWithRetry`. Production
   * default is 3. Tests pass `1` so the mock isn't retried 3 times
   * with backoff before the test sees the response.
   */
  maxAttempts?: number
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
 * The server returns `{ result: { data: ... } }` for success, or
 * `{ defined, code, status, message, data }` for ORPCError. We unwrap
 * the success shape; the error shape is identified by shape match and
 * surfaced as a `parse_error` carrying the server's code.
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
 * Detect an ORPCError wire shape on a parsed JSON body.
 *
 * Matches `{ defined: boolean, code: string, status: number, message: string, data: unknown }`.
 * Mirrors the validation done by `@orpc/client` server-side, so a
 * decode failure here means the same thing on both ends.
 */
const isOrpcErrorBody = (body: unknown): body is {
  code: string
  status: number
  message: string
  data: unknown
} =>
  body !== null &&
  typeof body === "object" &&
  "code" in body &&
  typeof (body as { code: unknown }).code === "string" &&
  "status" in body &&
  typeof (body as { status: unknown }).status === "number" &&
  "message" in body &&
  typeof (body as { message: unknown }).message === "string"

/**
 * Fetch the templates registry.
 *
 * Flow:
 *   1. (If not skipVersionCheck) probe /cli-version and warn if outdated.
 *      Failure here is silent — version check is best-effort.
 *   2. POST to the oRPC endpoint with the standard no-input body.
 *      Retry + backoff are handled by fetchWithRetry.
 *   3. Surface typed errors. ORPCError-shape bodies are surfaced as
 *      parse_error with the server's code; network failures (5xx,
 *      connection refused, malformed non-JSON) are network_error.
 *
 * Why direct fetch + manual unwrap instead of `@orpc/client` + RPCLink:
 *   - The CLI keeps a sophisticated retry/backoff/429-aware fetch via
 *     fetchWithRetry. Wrapping it into a global `fetch` shape to feed
 *     RPCLink adds friction without much gain: we still parse the body
 *     through Zod, we still throw the same CliError codes, and the
 *     unwrap is one short helper.
 *   - The 5-arg signature of `RPCLink.fetch` is fragile to mock under
 *     Vitest's `vi.stubGlobal("fetch")` — the mock receives a `Request`
 *     object whose body stream is consumed once and cannot be
 *     re-inspected. Tests that simulate 4xx/5xx with the typed client
 *     end up with a generic "Cannot parse response body" Error instead
 *     of an ORPCError, defeating the error-mapping goal.
 *   - We keep direct fetch + unwrap. Same wire format, same retry
 *     semantics, simpler code, testable.
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
    const opts: {
      apiUrl: string
      method: string
      body: string
      headers: Record<string, string>
      maxAttempts?: number
    } = {
      apiUrl,
      method: "POST",
      body: ORPC_NO_INPUT_BODY,
      headers: {
        "user-agent": USER_AGENT,
        accept: "application/json",
        "content-type": "application/json",
      },
    }
    if (options.maxAttempts !== undefined) opts.maxAttempts = options.maxAttempts
    res = await fetchWithRetry(opts)
  } catch (e) {
    throw networkError(
      `fetch failed: ${e instanceof Error ? e.message : String(e)}`,
    )
  }

  // The body can carry an ORPCError wire shape regardless of status —
  // 4xx, 5xx, and even some 2xx paths (e.g. Zod parse failure inside
  // a procedure) all encode the error as `{ defined, code, status,
  // message, data }`. We read the body first, then decide what to do.
  //
  // If the body is not JSON at all, that's a transport-level failure
  // (the server returned something we can't decode). network_error.
  let body: unknown
  try {
    body = JSON.parse(res.bodyText)
  } catch (e) {
    throw networkError(
      `endpoint returned non-JSON body: ${e instanceof Error ? e.message : String(e)}`,
    )
  }

  // ORPCError wire shape: surface the server's code instead of letting
  // it be re-wrapped by the contract Zod parse. This catches errors
  // thrown from procedures (e.g. templates_fetch_failed, RATE_LIMITED,
  // NOT_FOUND) and from Hono-level middleware (the global onError maps
  // to ORPCError since Phase 1).
  if (isOrpcErrorBody(body)) {
    throw parseError(
      `endpoint returned ORPCError ${body.code} (status ${body.status})`,
      `server returned ${body.code} (status ${body.status}): ${body.data ?? body.message}`,
    )
  }

  if (res.status < 200 || res.status >= 300) {
    throw networkError(`endpoint returned HTTP ${res.status}`)
  }

  const result = TemplatesListResponseV1.safeParse(unwrapOrpc(body))
  if (!result.success) {
    throw parseError(
      `response shape mismatch: ${result.error.issues
        .map((i) => `${i.path.join(".")} (${i.code})`)
        .join(", ")}`,
    )
  }

  return result.data.templates
}
