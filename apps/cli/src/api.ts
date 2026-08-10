import { TemplatesListResponseV1 } from "@workspace/contracts/v1"

import { networkError, parseError } from "./errors.js"
import { maybeWarnAboutOutdatedCli } from "./version-check.js"
import { buildOrpcClient } from "./api/client.js"

export type Template = TemplatesListResponseV1["templates"][number]

export type FetchOptions = {
  /** Skip the version probe. Used by tests and by the version probe itself. */
  skipVersionCheck?: boolean
  /**
   * Maximum number of retry attempts for `fetchWithRetry`. Production
   * default is 3. Tests pass `1` to skip the retry/backoff in unit tests
   * that target the typed client (procedure contract is tested via the
   * Server-Side Client pattern; see test/contract/templates.test.ts).
   */
  maxAttempts?: number
}

/**
 * Map an unknown error from the typed client to a CliError.
 *
 * The server emits one error channel: ORPCError (e.g. `RATE_LIMITED`,
 * `INTERNAL_SERVER_ERROR`, `NOT_FOUND`). The client decodes the wire
 * shape `{ defined, code, status, message, data }` into a real
 * `ORPCError` instance and throws it.
 *
 * We match the wire shape (not `instanceof ORPCError`) because the
 * client may live-load a different version of `@orpc/client` than the
 * one we import here for the type, breaking `instanceof`. Shape
 * matching is robust to that.
 *
 * Network errors (fetch failed before reaching the server) are
 * `TypeError`. Anything else falls through to a generic `network_error`
 * with the original message.
 */
export const orpcToCliError = (e: unknown): Error & { code: string } => {
  if (
    e !== null &&
    typeof e === "object" &&
    "code" in e &&
    typeof (e as { code: unknown }).code === "string" &&
    "status" in e &&
    typeof (e as { status: unknown }).status === "number"
  ) {
    const err = e as unknown as {
      code: string
      status: number
      data?: unknown
      message?: string
    }
    const detail =
      err.data !== undefined
        ? typeof err.data === "string"
          ? err.data
          : JSON.stringify(err.data)
        : err.message ?? ""
    return parseError(
      `endpoint returned ORPCError ${err.code} (status ${err.status})`,
      `server returned ${err.code} (status ${err.status}): ${detail}`,
    )
  }
  if (e instanceof TypeError) {
    return networkError(e.message)
  }
  return networkError(e instanceof Error ? e.message : String(e))
}

/**
 * Fetch the templates registry.
 *
 * Flow:
 *   1. (If not skipVersionCheck) probe /cli-version and warn if outdated.
 *      Failure here is silent — version check is best-effort.
 *   2. Build a typed oRPC client (./api/client.ts) and call
 *      templates.list. Retry + backoff are handled inside `orpcFetch`,
 *      which delegates to fetchWithRetry.
 *   3. Surface typed errors. ORPCError.code is mapped to a CliError.
 *
 * Testing:
 *   - The procedure contract (success, ORPCError shapes, contract
 *     drift) is tested via the Server-Side Client pattern in
 *     `test/contract/orpc-to-cli-error.test.ts`. Call
 *     `appRouter.templates.list()` directly, no HTTP.
 *   - The HTTP layer (retry, envelope parsing, isOrpcErrorBody
 *     mapping) is tested via a Node `http.createServer` fixture in
 *     `test/http/fetch-templates.test.ts`. The CLI hits the fixture
 *     URL.
 *   - We do not mock `fetch` globally. RPCLink builds a `Request`
 *     whose body is consumed once, and a global fetch mock bypasses
 *     RPCLink entirely. See Phase 3 of
 *     `docs/engineering/plans/orpc-client-migration.md` for details.
 */
export const fetchTemplates = async (
  apiUrl: string,
  options: FetchOptions = {},
): Promise<Template[]> => {
  if (!options.skipVersionCheck) {
    await maybeWarnAboutOutdatedCli(apiUrl)
  }

  const client = buildOrpcClient(apiUrl)
  try {
    const result = await client.templates.list()
    return result.templates
  } catch (e) {
    throw orpcToCliError(e)
  }
}
