import { defineConfig } from "vitest/config"

/**
 * Vitest config for the unit suite.
 *
 * The e2e suite (test/e2e/**) is opt-in via `pnpm test:e2e` and
 * runs against a separate config (vitest.e2e.config.ts) that
 * includes the e2e tests. The unit suite excludes them.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    exclude: ["test/e2e/**", "node_modules/**"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: "forks",
  },
})
