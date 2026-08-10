import { TemplatesListResponseV1 } from "@workspace/contracts/v1"
import { USER_AGENT } from "./constants.js"
import { networkError, parseError } from "./errors.js"
import { readDiskCache, writeDiskCache } from "./cache.js"
import { fetchWithRetry } from "./fetch-with-retry.js"
import { maybeWarnAboutOutdatedCli } from "./version-check.js"

export type Template = TemplatesListResponseV1["templates"][number]

export type FetchOptions = {
  /** Skip network entirely, serve cache only. Errors if no cache exists. */
  offline?: boolean
  /** Skip the version probe. Used by tests and by the version probe itself. */
  skipVersionCheck?: boolean
}

const TEMPLATES_CACHE_FILE = "templates.json"

/**
 * oRPC request body for a no-input procedure. The numeric key (`"0"`) is
 * the procedure's input slot; with no inputs we send `null`. The server
 * unwraps this and runs the named procedure.
 */
const ORPC_NO_INPUT_BODY = JSON.stringify({ "0": { json: null, meta: [] } })

const buildHeaders = (): Record<string, string> => ({
  "user-agent": USER_AGENT,
  accept: "application/json",
  "content-type": "application/json",
})

/**
 * Fetch the templates registry, with disk cache + retry + offline support.
 *
 * Flow:
 *   1. (If not skipVersionCheck) probe /cli-version and warn if outdated.
 *      Failure here is silent — version check is best-effort.
 *   2. If --offline, return the cached body or fail with network_error.
 *   3. Network fetch with retry (250ms / 750ms / 2s backoff, honors 429
 *      X-RateLimit-Reset). ETag is sent on every call when we have a cache.
 *   4. On 304, return the cached body.
 *   5. On 200, parse, write cache, return.
 *   6. On terminal failure, fall back to cache if we have one and the
 *      body is still parsable. Otherwise surface the network_error.
 */
export const fetchTemplates = async (
  apiUrl: string,
  options: FetchOptions = {},
): Promise<Template[]> => {
  if (!options.skipVersionCheck) {
    await maybeWarnAboutOutdatedCli(apiUrl)
  }

  const cached = readDiskCache<TemplatesListResponseV1>(TEMPLATES_CACHE_FILE)

  if (options.offline) {
    if (!cached) {
      throw networkError(
        "no cached registry available. Run without --offline first to populate the cache.",
      )
    }
    return cached.body.templates
  }

  let res: Awaited<ReturnType<typeof fetchWithRetry>>
  try {
    res = await fetchWithRetry({
      apiUrl,
      method: "POST",
      body: ORPC_NO_INPUT_BODY,
      headers: buildHeaders(),
    })
  } catch (e) {
    // All retries exhausted on a network error. Fall back to cache.
    if (cached) {
      process.stderr.write(
        "⚠ Using cached registry (offline — backend unreachable)\n",
      )
      return cached.body.templates
    }
    throw networkError(
      `fetch failed: ${e instanceof Error ? e.message : String(e)}`,
    )
  }

  if (res.status < 200 || res.status >= 300) {
    // Non-retryable failure (4xx other than 429, or 5xx after all retries).
    if (cached) {
      process.stderr.write(
        `⚠ Using cached registry (offline — server returned HTTP ${res.status})\n`,
      )
      return cached.body.templates
    }
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

  // oRPC wraps the procedure return in `{ result: { data: ... } }`.
  // Unwrap before validating against the public contract.
  const data =
    envelope !== null &&
    typeof envelope === "object" &&
    "result" in envelope &&
    envelope.result !== null &&
    typeof envelope.result === "object" &&
    "data" in envelope.result
      ? (envelope.result as { data: unknown }).data
      : envelope

  const result = TemplatesListResponseV1.safeParse(data)
  if (!result.success) {
    throw parseError(
      `response shape mismatch: ${result.error.issues.map((i) => `${i.path.join(".")} (${i.code})`).join(", ")}`,
    )
  }

  // oRPC responses don't carry an ETag; we rely on `fetchedAt` to drive
  // cache freshness in the CLI. Disk the body and move on.
  writeDiskCache(TEMPLATES_CACHE_FILE, result.data, null)
  return result.data.templates
}
