/**
 * P0 e2e suite for /templates/[template_slug].
 *
 * Per ADR-020:
 *   P0-4 — /templates/saas-starter renders the detail page.
 *   P0-5 — /templates/<unknown-slug> renders not-found.tsx.
 */
import { expect, test } from "@playwright/test"

import {
  browseAllTemplatesLink,
  detailBreadcrumb,
  detailHeading,
  installCliLink,
  notFoundHeading,
  viewSourceLink,
} from "./helpers/selectors.js"

test.describe("P0 /templates/[slug]", () => {
  test("P0-4: /templates/saas-starter renders the detail page", async ({
    page,
  }) => {
    await page.goto("/templates/saas-starter")

    await expect(detailHeading(page, "SaaS Starter")).toBeVisible()
    await expect(detailBreadcrumb(page)).toBeVisible()
    await expect(installCliLink(page)).toBeVisible()
    await expect(viewSourceLink(page)).toBeVisible()

    // The breadcrumb link points to /templates.
    await expect(detailBreadcrumb(page)).toHaveAttribute("href", "/templates")
  })

  test("P0-5: unknown slug renders not-found.tsx", async ({ page }) => {
    const response = await page.goto(
      "/templates/this-template-does-not-exist-xyz",
    )

    // The HTTP status is 404 (Next notFound()).
    expect(response?.status()).toBe(404)

    await expect(notFoundHeading(page)).toBeVisible()
    await expect(browseAllTemplatesLink(page)).toBeVisible()
    await expect(browseAllTemplatesLink(page)).toHaveAttribute(
      "href",
      "/templates",
    )
  })
})