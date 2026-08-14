import { toORPCError } from "@orpc/client"
import { TemplatesListResponseV1 } from "@workspace/contracts/v1"

import { networkError } from "../errors/index.js"
import { maybeWarnAboutOutdatedCli } from "../version/check.js"
import { orpc } from "./client.js"

export type Template = TemplatesListResponseV1["templates"][number]

export type FetchOptions = {
  /** Skip the version probe. Used by tests and by the version probe itself. */
  skipVersionCheck?: boolean
}

/**
 * Normalise an error thrown from the typed oRPC client.
 *
 * Uses `toORPCError` from `@orpc/client` to do the shape matching. This is
 * the canonical entry point: the lib does the matching internally and
 * exposes `[Symbol.hasInstance]` for the Next.js multi-context case.
 *
 * In V1 the only mapping is `TypeError -> networkError`, because that
 * is the only error the global `fetch` throws for an unreachable network.
 * `ORPCError` instances are propagated as-is: the calling command knows
 * the procedure semantics and decides how to surface them.
 */
export const normaliseError = (e: unknown): Error => {
  // The global fetch throws a TypeError for unreachable networks.
  // `toORPCError` from @orpc/client wraps anything into an ORPCError
  // (replacing the original cause), so we must check TypeError BEFORE
  // calling it.
  if (e instanceof TypeError) {
    return networkError(e.message)
  }
  // For anything that is already (or can be normalised to) an
  // ORPCError, propagate as-is. The calling command knows the
  // procedure semantics and decides how to surface them.
  return toORPCError(e) as Error
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
 *   3. Surface typed errors via `normaliseError`.
 *
 * The URL is fixed at `API_RPC_PATH` (imported from
 * `@workspace/api/base-path`). A per-command override is intentionally
 * not part of the public surface in V1.
 *
 * Testing:
 *   - The procedure contract is tested via the Server-Side Client
 *     pattern in `test/contract/orpc-to-cli-error.test.ts`. Call
 *     `appRouter.templates.list()` directly, no HTTP.
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
    throw normaliseError(e)
  }
}
