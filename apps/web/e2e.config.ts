import { defineConfig } from "@playwright/test"

import playwrightConfig from "./playwright.config.js"

/**
 * Local dev preset for the Playwright suite. Reuses the CI
 * preset from `playwright.config.ts` and overrides the bits
 * that need to differ for `pnpm dev`:
 *
 *  - No `BASE_URL` env: the local preset spins up its own
 *    `pnpm dev` server on port 3000.
 *  - No `VERCEL_AUTOMATION_BYPASS_SECRET`: local runs omit
 *    the bypass headers. Tests that depend on Vercel's
 *    preview-only forced failure path are skipped.
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
