/**
 * P-N session-aware header e2e suite (ADR-023).
 *
 * What this covers:
 *   - Anonymous visitors see the Log in / Sign up buttons in
 *     the header on every public page.
 *   - Clicking Log in navigates to apps/app's /login page
 *     (cross-app navigation; the marketing origin has no
 *     auth surface).
 *
 * What this deliberately does NOT cover:
 *   - The authenticated-avatar state. Exercising it requires
 *     either a real sign-up roundtrip through apps/app or a
 *     fabricated session cookie, both of which are out of
 *     scope for this PR. Manual staging smoke per Vercel
 *     preview (documented in the ADR) covers that path.
 *
 * The local preset (e2e.config.ts) starts a `pnpm dev`
 * webServer and the same header behavior is expected. Under
 * Vercel preview, the bypass secret is required and the
 * cross-app link target resolves against NEXT_PUBLIC_APP_URL.
 */
import { expect, test } from "@playwright/test"

import {
  headerSignInButton,
  headerSignUpButton,
  headerUserMenu,
} from "./helpers/selectors.js"

test.describe("Session-aware header (ADR-023)", () => {
  test("anonymous visitor on / sees Log in and Sign up", async ({ page }) => {
    await page.goto("/")

    // The right-side header control is always present (the
    // Skeleton placeholder during isPending, or the CTA set
    // after resolve). Wait for the network call to settle
    // before asserting so we don't catch the isPending branch.
    await expect(headerUserMenu(page)).toBeVisible()

    await expect(headerSignInButton(page)).toBeVisible()
    await expect(headerSignUpButton(page)).toBeVisible()
  })

  test("anonymous visitor on /blog sees Log in and Sign up", async ({
    page,
  }) => {
    await page.goto("/blog")

    await expect(headerUserMenu(page)).toBeVisible()
    await expect(headerSignInButton(page)).toBeVisible()
    await expect(headerSignUpButton(page)).toBeVisible()
  })

  test("clicking Log in navigates to apps/app's /login", async ({ page }) => {
    await page.goto("/")

    await headerSignInButton(page).click()

    // Cross-app navigation lands on the auth app's /login.
    // The full URL is built from NEXT_PUBLIC_APP_URL (env-injected
    // at build time) + "/login". We assert on the path so the
    // test is robust against dev/prod host swaps.
    await page.waitForURL((url) => url.pathname === "/login")
    expect(page.url()).toMatch(/\/login$/)
  })
})
