import { defineConfig } from "@playwright/test"

import playwrightConfig from "./playwright.config.js"

/**
 * Local dev preset for the Playwright suite. Reuses the CI
 * preset from `playwright.config.ts` and overrides the bits
 * that need to differ for `pnpm dev`:
 *
 *  - No `BASE_URL` env: the local preset spins up its own
 *    `pnpm dev` server on port 3000.
 *  - No `VERCEL_AUTOMATION_BYPASS_SECRET`: the local dev
 *    server runs without Deployment Protection, so the
 *    guard on the oRPC handler is closed-by-default. Tests
 *    that depend on the bypass header (P0-3, P0-6, forced-cache-poison)
 *    are expected to skip or fail under this preset; they
 *    only run against the Vercel preview CI preset.
 *
 * Per ADR-020.
 */
export default defineConfig({
  ...playwrightConfig,
  use: {
    ...playwrightConfig.use,
    baseURL: "http://localhost:3000",
    extraHTTPHeaders: {},
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
})