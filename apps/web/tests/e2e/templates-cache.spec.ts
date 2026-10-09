/**
 * P0 e2e suite — /templates resilience, repeated-visit behaviour,
 * and post-cache-poisoning regression guard.
 *
 * P0-3 — /templates and /templates/[slug] stay populated across
 *        reloads and back/forward navigation, even when the
 *        upstream API is unreachable. The static build never
 *        touches the API to render these pages; the catalog
 *        lives in the artifact.
 * P0-6 — under the static build, `x-nextjs-cache: HIT` is the
 *        expected outcome on `/templates` and the detail pages.
 *        A `MISS` indicates a regression to the dynamic /
 *        oRPC-driven render path.
 * P0-7 — repeated visits (index → detail → back → index, reload)
 *        must keep the catalog populated end-to-end. This is the
 *        scenario the production incident presented.
 */
import { expect, test } from "@playwright/test"

import {
  detailBreadcrumb,
  templatesCard,
  templatesHeading,
} from "./helpers/selectors.js"

test.describe("P0 /templates resilience (static build)", () => {
  test("P0-3: /templates stays populated without contacting the API", async ({
    page,
  }) => {
    await page.route("**/api/v1/**", (route) => route.abort())
    await page.goto("/templates")
    await expect(templatesHeading(page)).toBeVisible()
    await expect(templatesCard(page).first()).toBeVisible()
  })

  test("P0-6: x-nextjs-cache MISS on /templates signals a regression to the dynamic render path", async ({
    page,
  }) => {
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

    expect(responses.length).toBeGreaterThan(0)
    const misses = responses.filter(
      (r) => r.cacheState === "MISS" || r.cacheState === null,
    )
    expect(
      misses,
      `x-nextjs-cache MISS observed on /templates — static render regression. Responses: ${JSON.stringify(responses)}`,
    ).toHaveLength(0)
  })

  test("P0-7: index → detail → back → reload keeps the catalog populated", async ({
    page,
  }) => {
    // The scenario in the production incident: open the index,
    // jump to a detail page, return to the index, reload. The
    // catalog must stay visible at every step. With a static
    // build this is trivial; before the fix, an upstream 502
    // pinned the second visit to an empty catalog.
    await page.route("**/api/v1/**", (route) => route.abort())

    await page.goto("/templates")
    await expect(templatesHeading(page)).toBeVisible()
    await expect(templatesCard(page).first()).toBeVisible()

    // Click the first card to navigate to a detail page.
    const firstCardLink = templatesCard(page).first()
    const href = await firstCardLink.getAttribute("href")
    expect(href).toMatch(/^\/templates\/[a-z-]+$/)
    await firstCardLink.click()
    await page.waitForURL(/\/templates\/[a-z-]+/)

    // Detail page renders the heading from its snapshot.
    const slug = (page.url().match(/\/templates\/([a-z-]+)/) ?? [])[1]
    expect(slug).toBeTruthy()
    await expect(detailBreadcrumb(page)).toBeVisible()

    // The detail page should expose its README content. The
    // loader ships it from disk; a missing snapshot would
    // collapse the page. The H1 of each snapshot is unique.
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible()

    // Back to the index via the in-page breadcrumb link.
    await detailBreadcrumb(page).click()
    await page.waitForURL("**/templates")
    await expect(templatesHeading(page)).toBeVisible()
    await expect(templatesCard(page).first()).toBeVisible()

    // Reload. The catalog must remain.
    await page.reload()
    await expect(templatesHeading(page)).toBeVisible()
    await expect(templatesCard(page).first()).toBeVisible()
  })
})
