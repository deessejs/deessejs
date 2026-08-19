import { ORPCError } from "@orpc/server"
import { TemplatesListResponseV1 } from "@workspace/contracts/v1"
import { base } from "../base.js"
import { TEMPLATES } from "../../templates.js"
import { enrich } from "../../core/templates/index.js"
import { logger } from "../../constants/logger.js"

/**
 * Public procedure: list the templates in the catalog.
 *
 * Hits GitHub's REST API in parallel for every registry entry
 * (no cache, fail loud). When `enrich()` rejects because GitHub
 * is unreachable, rate-limited, or returns an unexpected status,
 * the handler translates that into a stable `ORPCError` with
 * code `TEMPLATES_FETCH_FAILED` (HTTP 502 — Bad Gateway, since
 * GitHub is the upstream we depend on).
 *
 * The wire-code is declared via `.errors(...)` so the typed
 * client can branch on it:
 *
 *   try {
 *     const { templates } = await orpc.templates.list(undefined, liveCache)
 *   } catch (err) {
 *     if (err instanceof ORPCError && err.code === "TEMPLATES_FETCH_FAILED") {
 *       // Upstream GitHub issue — show a "Try again later" state
 *     }
 *   }
 *
 * Originally documented intent (issue #81): translate to a 503.
 * Implemented as 502 because GitHub is an upstream dependency
 * and 502 (Bad Gateway) is the semantically correct status.
 * Clients used to the documented 503 should treat any non-2xx
 * as retriable — the status code is informational.
 */
export const list = base
  .errors({
    TEMPLATES_FETCH_FAILED: {
      message:
        "Failed to load the templates catalog from the upstream registry. " +
        "Try again in a few minutes.",
    },
  })
  .handler(async ({ context }): Promise<TemplatesListResponseV1> => {
    try {
      const templates = await enrich(TEMPLATES)
      return { templates }
    } catch (error) {
      // `enrich()` throws plain `Error` instances; surface them as
      // a stable wire-code instead of letting them bubble up as
      // INTERNAL_SERVER_ERROR (which would conflate this with
      // genuine server bugs).
      const message =
        error instanceof Error ? error.message : "Upstream fetch failed"
      logger.error("templates_fetch_failed", {
        requestId: context.requestId,
        message,
      })
      throw new ORPCError("TEMPLATES_FETCH_FAILED", {
        status: 502,
        message,
      })
    }
  })

export const templatesRouter = {
  list,
}
