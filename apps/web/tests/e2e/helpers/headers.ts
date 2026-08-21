/**
 * Per-test header helpers. Sets the test-only x-e2e-force-fail
 * header scoped to the browser context so other tests in
 * parallel cannot race. The x-vercel-protection-bypass +
 * x-vercel-set-bypass-cookie headers are set globally in
 * playwright.config.ts (they're needed to authenticate past
 * Vercel Deployment Protection on every request).
 *
 * Header values are an enum per ADR-020:
 *
 *   "1" -> force ORPCError("TEMPLATES_FETCH_FAILED", status 502)
 *   "2" -> return { templates: [] } (empty catalog)
 *   any other value -> no-op (happy path)
 *
 * A typo from the test runner silently falls back to the
 * happy path — the guard is closed-by-default. Three unit
 * tests pin the guard's behaviour at packages/api/tests/integration/rpc/templates.test.ts.
 */
import { type Page } from "@playwright/test"

export type E2eForceFail = "1" | "2"

const FORCE_FAIL_HEADER = "x-e2e-force-fail"

/**
 * Set the x-e2e-force-fail header on the current page only.
 * The Playwright `setExtraHTTPHeaders` API is scoped to the
 * browser context, so two tests in parallel cannot race
 * each other.
 *
 * The header is cleared by Playwright when the browser
 * context closes (i.e. between tests in the same worker).
 */
export const setForceFail = async (
  page: Page,
  value: E2eForceFail,
) => {
  await page.setExtraHTTPHeaders({ [FORCE_FAIL_HEADER]: value })
}

/**
 * Clear the x-e2e-force-fail header so subsequent navigations
 * hit the real upstream. Use this in the `finally` block of
 * every test that called `setForceFail` to keep the test
 * context clean for the next test.
 */
export const clearForceFail = async (page: Page) => {
  await page.setExtraHTTPHeaders({ [FORCE_FAIL_HEADER]: "" })
}