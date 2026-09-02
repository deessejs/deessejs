/**
 * P0 e2e suite for the /templates index page.
 *
 * Per ADR-020:
 *   P0-1 — populated catalog renders the templates grid.
 *   P0-2 — empty catalog renders the documented empty state.
 *
 * No header injection here; the tests hit the real upstream
 * via the Vercel preview.
 */
import { expect, test } from "@playwright/test"

import {
  emptyCatalog,
  searchInput,
  sidebarCount,
  sidebarFramework,
  sidebarType,
  templatesCard,
  templatesGrid,
  templatesHeading,
} from "./helpers/selectors.js"

test.describe("P0 /templates index", () => {
  test("P0-1: populated catalog renders the templates grid", async ({
    page,
  }) => {
    await page.goto("/templates")

    await expect(templatesHeading(page)).toBeVisible()
    await expect(sidebarType(page)).toBeVisible()
    await expect(sidebarFramework(page)).toBeVisible()

    // At least one template card. The V1 registry ships exactly one
    // (`saas-starter`) so the floor is 1.
    const cards = templatesCard(page)
    await expect(cards.first()).toBeVisible()

    // Sidebar summary counts the cards.
    await expect(sidebarCount(page)).toBeVisible()

    // The grid container is present and the cards are inside it.
    await expect(templatesGrid(page)).toBeVisible()
  })

  test("P0-2: empty catalog renders the documented empty state", async ({
    page,
    context,
  }) => {
    // Set the test-only header to force an empty catalog from
    // the oRPC handler. The header is scoped to this browser
    // context only.
    await context.setExtraHTTPHeaders({ "x-e2e-force-fail": "2" })

    try {
      await page.goto("/templates")

      // The empty branch renders a H1 + a CLI hint. The grid,
      // sidebar, search input are NOT rendered (per the
      // branch in page.tsx).
      await expect(
        page.getByRole("heading", { name: "Templates" }),
      ).toBeVisible()
      await expect(emptyCatalog(page)).toBeVisible()
      await expect(page.getByText("No templates available right now.")).toBeVisible()
      await expect(page.getByText("deessejs list")).toBeVisible()

      await expect(templatesGrid(page)).toHaveCount(0)
      await expect(searchInput(page)).toHaveCount(0)
      await expect(sidebarType(page)).toHaveCount(0)
    } finally {
      await context.setExtraHTTPHeaders({ "x-e2e-force-fail": "" })
    }
  })
})