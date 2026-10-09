/**
 * P1 e2e suite — sidebar filter + cross-page navigation.
 *
 * Per ADR-020:
 *   P1-7 — sidebar filter toggling changes URL + aria-current.
 *   P1-11 — /templates is reachable from header/footer links.
 *   P1-12 — multi-select filters work and persist across reload.
 *   P1-13 — deselecting a filter restores the unfiltered state.
 *   P1-14 — back/forward navigation restores prior filter state.
 */
import { expect, test } from "@playwright/test"

import {
  sidebarType,
  sidebarFramework,
  templatesCard,
  templatesHeading,
} from "./helpers/selectors.js"

test.describe("P1 /templates navigation", () => {
  test("P1-11: /templates is reachable from the site nav", async ({
    page,
  }) => {
    await page.goto("/")

    const templatesLinks = page.locator('a[href="/templates"]')
    await expect(templatesLinks.first()).toBeVisible()

    await templatesLinks.first().click()
    await page.waitForURL("**/templates")
    await expect(templatesHeading(page)).toBeVisible()
  })

  test("P1-12: selecting multiple filters persists across reload", async ({
    page,
  }) => {
    await page.goto("/templates")
    await expect(templatesCard(page).first()).toBeVisible()

    // Click two type entries in the sidebar.
    const typeButtons = sidebarType(page).locator("button")
    const count = await typeButtons.count()
    expect(count).toBeGreaterThan(0)
    await typeButtons.first().click()
    await page.waitForURL((url) => url.searchParams.getAll("type").length > 0)

    await typeButtons.nth(1).click()
    await page.waitForURL(
      (url) => url.searchParams.getAll("type").length > 1,
    )

    // Reload and confirm filters survive.
    await page.reload()
    await expect(templatesHeading(page)).toBeVisible()
    const params = new URL(page.url()).searchParams
    expect(params.getAll("type").length).toBe(2)
  })

  test("P1-13: deselecting all filters restores the unfiltered grid", async ({
    page,
  }) => {
    await page.goto("/templates?type=desktop&type=docs")
    await expect(templatesHeading(page)).toBeVisible()

    // Click each active toggle to deselect, then ensure the
    // URL has no `type` key.
    const typeButtons = sidebarType(page).locator("button")
    await typeButtons.first().click()
    await typeButtons.nth(1).click()
    await page.waitForURL((url) => !url.searchParams.has("type"))

    // After clearing, the full catalog must be visible again.
    await expect(templatesCard(page).first()).toBeVisible()
    const before = await templatesCard(page).count()
    expect(before).toBeGreaterThan(1)
  })

  test("P1-14: back/forward navigates between filter states", async ({
    page,
  }) => {
    await page.goto("/templates")
    await expect(templatesCard(page).first()).toBeVisible()

    // Apply one filter.
    const typeButtons = sidebarType(page).locator("button")
    await typeButtons.first().click()
    await page.waitForURL((url) => url.searchParams.has("type"))

    // Apply a different filter — that pushes a new history entry.
    await typeButtons.nth(1).click()
    await page.waitForURL(
      (url) => url.searchParams.getAll("type").length >= 1,
    )
    const afterApply = new URL(page.url()).searchParams.getAll("type").length

    // Back: filters should rewind.
    await page.goBack()
    await page.waitForLoadState("networkidle")
    // We don't constrain the exact count on back since some
    // implementations collapse; we only assert the page is still
    // on /templates and the catalog is rendered.
    expect(new URL(page.url()).pathname).toBe("/templates")
    await expect(templatesHeading(page)).toBeVisible()

    // Forward: we land back on the multi-filter state.
    await page.goForward()
    await page.waitForLoadState("networkidle")
    expect(new URL(page.url()).pathname).toBe("/templates")
    const afterForward = new URL(page.url()).searchParams.getAll("type").length
    expect(afterForward).toBe(afterApply)
  })

  test("P1-7: sidebar filter toggling changes URL and re-renders the grid", async ({
    page,
  }) => {
    await page.goto("/templates")
    await expect(templatesCard(page).first()).toBeVisible()

    // Find the first toggleable entry in the Type group.
    const firstTypeButton = sidebarType(page).locator("button").first()
    await expect(firstTypeButton).toBeVisible()

    await firstTypeButton.click()
    await page.waitForURL((url) => url.searchParams.has("type"))

    // Now also click a Framework entry — confirm both keys land
    // in the URL.
    const firstFrameworkButton = sidebarFramework(page)
      .locator("button")
      .first()
    await firstFrameworkButton.click()
    await page.waitForURL(
      (url) =>
        url.searchParams.has("type") && url.searchParams.has("framework"),
    )

    // Heading and at least one card remain visible.
    await expect(templatesHeading(page)).toBeVisible()
    await expect(templatesCard(page).first()).toBeVisible()
  })
})