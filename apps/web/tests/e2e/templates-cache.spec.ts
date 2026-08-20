/**
 * P0 e2e suite — error boundary + issue #81 regression guard.
 *
 * Per ADR-020:
 *   P0-3 — error.tsx renders on a forced oRPC failure;
 *          "Try again" recovers to the populated state.
 *   P0-6 — issue #81 cache-poisoning regression guard:
 *          `x-nextjs-cache` header never reads "HIT" on the
 *          /templates document response.
 *
 * Both tests use the per-context `x-e2e-force-fail` header
 * to drive the handler's failure path. The x-vercel-protection-bypass
 * + x-vercel-set-bypass-cookie headers are set globally in
 * playwright.config.ts.
 */
import { expect, test } from "@playwright/test"

import {
  errorHeading,
  templatesHeading,
  tryAgainButton,
} from "./helpers/selectors.js"

test.describe("P0 /templates error + cache", () => {
  test("P0-3: error.tsx renders on a forced oRPC failure; Try again recovers", async ({
    page,
    context,
  }) => {
    // Drive the failure path: the handler throws ORPCError
    // "TEMPLATES_FETCH_FAILED" with status 502.
    await context.setExtraHTTPHeaders({ "x-e2e-force-fail": "1" })

    try {
      await page.goto("/templates")

      // Error.tsx renders the documented copy. The error
      // boundary catches the thrown ORPCError and renders the
      // client-side fallback.
      await expect(errorHeading(page)).toBeVisible()
      await expect(
        page.getByText(/Check your connection/i),
      ).toBeVisible()
      await expect(tryAgainButton(page)).toBeVisible()

      // Clear the force-fail header so the recovery request
      // reaches the real upstream.
      await context.setExtraHTTPHeaders({ "x-e2e-force-fail": "" })

      // Click "Try again" — calls `reset()` which re-runs
      // the parent RSC. The second render must reach the
      // populated state.
      await tryAgainButton(page).click()
      await expect(templatesHeading(page)).toBeVisible({
        timeout: 10_000,
      })
      // The error boundary no longer renders.
      await expect(errorHeading(page)).toHaveCount(0)
    } finally {
      await context.setExtraHTTPHeaders({ "x-e2e-force-fail": "" })
    }
  })

  test("P0-6: x-nextjs-cache header never reads HIT on /templates (issue #81 regression)", async ({
    page,
  }) => {
    // Capture every /templates response and assert none of
    // them carry the x-nextjs-cache: HIT header value. A HIT
    // here is the smoking gun for a regression to the old
    // site-wide tag introduced before PR #85.
    const responses: Array<{
      url: string
      cacheState: string | null
    }> = []
    page.on("response", (response) => {
      const url = response.url()
      if (url.endsWith("/templates") || url.includes("/templates?")) {
        responses.push({
          url,
          cacheState: response.headers()["x-nextjs-cache"] ?? null,
        })
      }
    })

    await page.goto("/templates")
    await expect(templatesHeading(page)).toBeVisible()

    // Navigate again to trigger a second RSC stream.
    await page.reload()
    await expect(templatesHeading(page)).toBeVisible()

    // We should have at least one captured response.
    expect(responses.length).toBeGreaterThan(0)

    // None of them may carry the HIT value.
    const hits = responses.filter((r) => r.cacheState === "HIT")
    expect(
      hits,
      `x-nextjs-cache: HIT observed on /templates — issue #81 regression. Responses: ${JSON.stringify(responses)}`,
    ).toHaveLength(0)
  })
})