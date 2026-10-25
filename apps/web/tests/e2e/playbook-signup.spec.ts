/**
 * The browser flow of the playbook signup.
 *
 * The form posts to a route handler on the same origin, not to the
 * API. A preview deployment of the API is protected by Vercel, and
 * Vercel answers a CORS preflight with a redirect to its sign-in
 * page: the browser cannot follow a redirect inside a preflight, so
 * the preflight fails and the POST never leaves the page. That was
 * the bug this suite covers.
 *
 * The suite asserts three things:
 *
 *   1. the POST goes to the same-origin route, not to the API host;
 *   2. the console carries no cross-origin failure;
 *   3. the form reaches a terminal state, with the toast that
 *      matches what the API answered.
 *
 * The API side of the flow needs the web project to hold the bypass
 * secret of the API project, `API_PROTECTION_BYPASS_SECRET`. Until
 * that is configured, the route answers 502 and the suite skips with
 * the reason, rather than failing every pull request.
 */
import { expect, test } from "@playwright/test"

const PROXY_PATH = "/api/playbook/signup"

/** Resend's safe test address: it never reaches an inbox. */
const TEST_EMAIL = "delivered@resend.dev"

test.describe("/playbook signup", () => {
  test("submits the form through the same-origin route", async ({ page }) => {
    const consoleErrors: string[] = []
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text())
    })

    const posts: string[] = []
    page.on("request", (request) => {
      if (request.method() === "POST") posts.push(request.url())
    })

    await page.goto("/playbook")
    await page.getByRole("textbox", { name: "Email address" }).fill(TEST_EMAIL)
    await page.getByRole("button", { name: "Get the free playbook" }).click()

    const response = await page.waitForResponse(
      (candidate) => candidate.url().includes(PROXY_PATH),
    )

    // The browser never calls the API host: the call is same-origin,
    // so no preflight and no CORS are involved.
    expect(posts.some((url) => url.includes(PROXY_PATH))).toBe(true)
    expect(
      consoleErrors.filter((message) => message.includes("Cross-Origin")),
    ).toEqual([])

    if (response.status() === 502) {
      test.skip(
        true,
        "The API preview is not reachable from the web preview. Set " +
          "API_PROTECTION_BYPASS_SECRET on the deessejs-web project, " +
          "with the bypass secret of the deessejs-app project.",
      )
    }

    await expect(
      page.getByText("Check your inbox. The PDF is on the way."),
    ).toBeVisible()
  })
})
