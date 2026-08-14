import { TemplatesListResponseV1 } from "@workspace/contracts/v1"

import { networkError, parseError } from "../errors/index.js"
import { maybeWarnAboutOutdatedCli } from "../version/check.js"
import { orpc } from "./client.js"

export type Template = TemplatesListResponseV1["templates"][number]

export type FetchOptions = {
  /** Skip the version probe. Used by tests and by the version probe itself. */
  skipVersionCheck?: boolean
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
 *   1. (If not skipVersionCheck) probe /version and warn if outdated.
 *      Failure here is silent — version check is best-effort.
 *   2. Call templates.list on the shared typed client. Retry on
 *      5xx and 429 is handled by the official oRPC plugins configured
 *      in ./client.ts.
 *   3. Surface typed errors. ORPCError.code is mapped to a CliError.
 *
 * The URL is fixed at `API_RPC_PATH` (imported from
 * `@workspace/api/base-path`). A per-command override is intentionally
 * not part of the public surface in V1 — it adds complexity without a
 * concrete use case.
 *
 * Testing:
 *   - The procedure contract (success, ORPCError shapes, contract
 *     drift) is tested via the Server-Side Client pattern in
 *     `test/contract/orpc-to-cli-error.test.ts`. Call
 *     `appRouter.templates.list()` directly, no HTTP.
 *   - The HTTP layer is exercised end-to-end by the integration
 *     tests under `test/integration/`. They use the fake-api fixture
 *     to serve a real HTTP response, and the real typed client
 *     (with plugins) processes it.
 */
export const fetchTemplates = async (
  options: FetchOptions = {},
): Promise<Template[]> => {
  if (!options.skipVersionCheck) {
    await maybeWarnAboutOutdatedCli()
  }

  try {
    const result = await orpc.templates.list()
    return result.templates
  } catch (e) {
    throw orpcToCliError(e)
  }
}
