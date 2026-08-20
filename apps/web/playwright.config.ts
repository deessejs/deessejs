import { defineConfig } from "@playwright/test"

/**
 * Playwright config (CI preset, default export).
 *
 * Hits the deployed Vercel preview URL passed via `BASE_URL`.
 * The repo workflow `apps-web-e2e.yml` sets `BASE_URL` to
 * `${{ github.event.client_payload.url }}` (from the
 * `repository_dispatch` payload of `vercel.deployment.success`).
 *
 * Per ADR-020, the test runner authenticates past Vercel
 * Deployment Protection via `VERCEL_AUTOMATION_BYPASS_SECRET`,
 * which the Vercel platform exposes as a system env var on
 * the deployed runtime; the same secret is mirrored in CI as
 * a GitHub Actions repository secret named identically.
 *
 * See https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
 */

const BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

if (!BYPASS_SECRET) {
  throw new Error(
    "VERCEL_AUTOMATION_BYPASS_SECRET is required to run tests against protected deployments.",
  )
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Pinned: e2e forces the failure path via header injection; parallel workers could race the guard.
  // `workers` is omitted on local runs (Playwright uses the
  // detected core count). On CI it is pinned to 1 because
  // the guard's per-context header scoping is per-worker
  // and we don't want race conditions between matrix jobs.
  ...(process.env.CI ? { workers: 1 } : {}),
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["html", { open: "never" }]] : "list",
  outputDir: "tests/e2e/test-results",
  use: {
    baseURL: process.env.BASE_URL,
    actionTimeout: 10_000,
    extraHTTPHeaders: {
      // Authenticate past Vercel Deployment Protection. The
      // `x-vercel-set-bypass-cookie: true` follow-up makes
      // Vercel set a cookie so subsequent client-side
      // navigations (next/link, the "Try again" reset, etc.)
      // inherit the bypass without re-sending the header.
      "x-vercel-protection-bypass": BYPASS_SECRET,
      "x-vercel-set-bypass-cookie": "true",
    },
    trace: "retain-on-failure",
  },
})