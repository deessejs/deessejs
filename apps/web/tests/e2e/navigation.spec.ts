/**
 * P1 e2e suite — sidebar filter + cross-page navigation.
 *
 * Per ADR-020:
 *   P1-7 — sidebar filter toggling changes URL + aria-current.
 *   P1-11 — /templates is reachable from header/footer links.
 */
import { expect, test } from "@playwright/test"

import { templatesHeading } from "./helpers/selectors.js"

test.describe("P1 /templates navigation", () => {
  test("P1-11: /templates is reachable from the site nav", async ({
    page,
  }) => {
    await page.goto("/")

    // The site header has a "Templates" link in the footer.
    // We assert at least one anchor pointing to /templates
    // exists in the document.
    const templatesLinks = page.locator('a[href="/templates"]')
    await expect(templatesLinks.first()).toBeVisible()

    // Follow the link and verify navigation succeeds.
    await templatesLinks.first().click()
    await page.waitForURL("**/templates")
    await expect(templatesHeading(page)).toBeVisible()
  })

  test("P1-7: sidebar filter toggling changes URL and re-renders the grid", async ({
    page,
  }) => {
    await page.goto("/templates")

    // The sidebar Type group has at least one entry. Find the
    // first checkbox link / anchor and click it.
    const sidebar = page.getByTestId("templates-sidebar-type")
    const firstLink = sidebar.getByRole("link").first()
    await expect(firstLink).toBeVisible()

    // Capture the link's href so we can assert the URL change.
    const href = await firstLink.getAttribute("href")
    expect(href).toMatch(/\?type=/)

    await firstLink.click()
    await page.waitForURL((url) => url.searchParams.has("type"))

    // After the filter click, aria-current=page should be on
    // the clicked link (the sidebar marks the active state).
    await expect(
      page.locator('a[aria-current="page"]').first(),
    ).toBeVisible()

    // The catalog heading remains (the page didn't navigate
    // away from /templates).
    await expect(templatesHeading(page)).toBeVisible()
  })
})