import { defineConfig } from "@playwright/test"

/**
 * Playwright config (CI preset, default export).
 *
 * Hits the deployed Vercel preview URL passed via BASE_URL in
 * apps-web-e2e.yml. For local runs, e2e.config.ts overrides the
 * base URL and starts a local Next.js server without Deployment
 * Protection.
 *
 * Preview CI requires the Vercel bypass secret. Local E2E runs
 * omit the bypass headers; tests that depend on those headers
 * skip themselves.
 */

const BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

if (process.env.BASE_URL && !BYPASS_SECRET) {
  throw new Error(
    "VERCEL_AUTOMATION_BYPASS_SECRET is required to run tests against protected deployments.",
  )
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Pinned: e2e forces the failure path via header injection; parallel workers could race the guard.
  ...(process.env.CI ? { workers: 1 } : {}),
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["html", { open: "never" }]] : "list",
  outputDir: "tests/e2e/test-results",
  use: {
    baseURL: process.env.BASE_URL,
    actionTimeout: 10_000,
    extraHTTPHeaders: BYPASS_SECRET
      ? {
          // Authenticate only when testing a protected Vercel preview.
          "x-vercel-protection-bypass": BYPASS_SECRET,
          "x-vercel-set-bypass-cookie": "true",
        }
      : {},
    trace: "retain-on-failure",
  },
})
