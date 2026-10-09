/**
 * P0 e2e suite — /templates resilience and post-cache-poisoning
 * regression guard.
 *
 * Per ADR-020 (revised):
 *   P0-3 — /templates stays populated even when the upstream
 *          API is unreachable. The previous architecture called
 *          the oRPC `templates.list` endpoint at request time;
 *          a 502 propagated to the segment's `error.tsx` and
 *          left the page header-less. The current architecture
 *          renders the catalog from the local registry with no
 *          runtime dependency, so the page must succeed even if
 *          the API is down. We assert the catalog is visible
 *          without ever hitting the API.
 *   P0-6 — the previous regression guard asserted that
 *          `x-nextjs-cache: HIT` was never observed on
 *          /templates. After the move to a fully static
 *          build, a HIT is the EXPECTED outcome (and is a
 *          signal the page is being served from the build-time
 *          cache, not from the live oRPC handler). The new
 *          regression guard inverts the assertion: a `MISS` on
 *          /templates signals a regression to the dynamic
 *          / oRPC-driven render path.
 *
 * Both tests are run against the preview deployment for this
 * PR. They do not require GitHub credentials or any upstream
 * service to be available.
 */
import { expect, test } from "@playwright/test"

import {
  templatesCard,
  templatesHeading,
} from "./helpers/selectors.js"

test.describe("P0 /templates resilience (static build)", () => {
  test("P0-3: /templates stays populated without contacting the API", async ({
    page,
  }) => {
    // Intercept any call to /api/v1 and abort it. The new
    // /templates render does not depend on the API; if it does
    // (regression), the page will hang or render the
    // empty-catalog branch.
    await page.route("**/api/v1/**", (route) => route.abort())

    await page.goto("/templates")
    await expect(templatesHeading(page)).toBeVisible()
    // Cards are present even with the API blocked.
    await expect(templatesCard(page).first()).toBeVisible()
  })

  test("P0-6: x-nextjs-cache MISS on /templates signals a regression to the dynamic render path", async ({
    page,
  }) => {
    // Capture every /templates response and assert the
    // x-nextjs-cache header reads HIT, not MISS. After the
    // static rebuild, /templates is served from the prerendered
    // HTML on a HIT. A MISS indicates the page re-entered the
    // dynamic / oRPC-driven render path.
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
    await expect(templatesCard(page).first()).toBeVisible()

    // We should have at least one captured response.
    expect(responses.length).toBeGreaterThan(0)

    // Every captured response must show a HIT (static). A MISS
    // is the new regression marker.
    const misses = responses.filter(
      (r) => r.cacheState === "MISS" || r.cacheState === null,
    )
    expect(
      misses,
      `x-nextjs-cache MISS observed on /templates — static render regression. Responses: ${JSON.stringify(responses)}`,
    ).toHaveLength(0)
  })
})
