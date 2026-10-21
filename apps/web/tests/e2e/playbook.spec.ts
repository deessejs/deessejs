/**
 * e2e suite for the /playbook lead-magnet page.
 *
 * The PDF assertion is the load-bearing one. The email template
 * links the deliverable at `<WEB_URL>/playbook.pdf`, and the file
 * lives at `apps/web/public/playbook.pdf`. Those are two different
 * paths, and Next serves `public/` at the root, so a PDF dropped
 * into `public/playbook/` is served from `/playbook/playbook.pdf`
 * and the link in every email 404s. The signup flow is best-effort
 * by design, so nothing surfaces the failure: the visitor gets the
 * email, clicks the link, and gets a 404.
 *
 * The page is also worth a smoke test, since it is the only
 * marketing route in the app that renders a lead-magnet form.
 */
import { expect, test } from "@playwright/test"

test.describe("/playbook", () => {
  test("renders the lead magnet", async ({ page }) => {
    await page.goto("/playbook")

    await expect(
      page.getByRole("heading", {
        name: "From AI-Generated Code to Production Software",
        level: 1,
      }),
    ).toBeVisible()
    await expect(page.getByRole("textbox", { name: "Email address" })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Get the free playbook" }),
    ).toBeVisible()
  })

  test("serves the PDF the signup email links to", async ({ request }) => {
    const response = await request.get("/playbook.pdf")

    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toContain("application/pdf")
  })
})
