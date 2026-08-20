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
 *
 * E2E test guard (ADR-020):
 *
 * Playwright e2e suites exercise the failure / empty paths by
 * sending two request headers:
 *
 *   x-vercel-protection-bypass: <Vercel Automation Bypass secret>
 *     AND
 *   x-e2e-force-fail: "1" (force a 502 TEMPLATES_FETCH_FAILED)
 *   x-e2e-force-fail: "2" (force an empty catalog)
 *
 * The bypass header is required to authenticate against a
 * Deployment-Protection-protected Vercel preview deployment; the
 * same secret value is matched against process.env.VERCEL_AUTOMATION_BYPASS_SECRET
 * (a system env var Vercel-managed injects on every
 * deployment that has Deployment Protection + a bypass secret
 * configured). See
 * https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
 *
 * The x-e2e-force-fail header is an *enum* with three valid
 * values: "1" forces failure, "2" forces empty, anything else
 * is a no-op (the test runner's normal fetch). A typo from the
 * test runner silently falls back to the happy path — the
 * three unit tests on this guard pin the contract that the
 * guard is closed-by-default, production-impervious, and
 * header-mismatch. See packages/api/tests/integration/rpc/templates.test.ts.
 *
 * The guard is gated on NODE_ENV !== "production" so a future
 * contributor cannot accidentally fire the test path from
 * production traffic. The env check is the floor; the secret
 * comparison is the ceiling.
 */
const e2eForceFail = (
  requestHeaders: Headers,
): TemplatesListResponseV1 | null => {
  const bypass = requestHeaders.get("x-vercel-protection-bypass")
  const expected = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  // Closed by default: missing secret OR missing/non-matching
  // header means the test path is a no-op.
  if (!expected || !bypass || bypass !== expected) {
    return null
  }
  const force = requestHeaders.get("x-e2e-force-fail")
  if (force === "1") {
    throw new ORPCError("TEMPLATES_FETCH_FAILED", { status: 502 })
  }
  if (force === "2") {
    return { templates: [] }
  }
  return null
}

export const list = base
  .errors({
    TEMPLATES_FETCH_FAILED: {
      message:
        "Failed to load the templates catalog from the upstream registry. " +
        "Try again in a few minutes.",
    },
  })
  .handler(async ({ context }): Promise<TemplatesListResponseV1> => {
    // E2E guard runs in EVERY environment except production.
    // In production the guard is a no-op (closed-by-default + the
    // NODE_ENV check on the import below).
    if (process.env.NODE_ENV !== "production") {
      const forced = e2eForceFail(context.headers)
      if (forced !== null) return forced
    }

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
