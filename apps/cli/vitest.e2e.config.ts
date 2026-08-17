import { defineConfig } from "vitest/config"

/**
 * Vitest config for the e2e suite.
 *
 * The e2e suite is opt-in (`pnpm test:e2e`) because it spawns the
 * CLI binary as a subprocess and requires a tarball from the verify
 * workflow. The default `pnpm test` runs the unit suite only, which
 * excludes `test/e2e/**`.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/e2e/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    pool: "forks",
    poolOptions: {
      forks: {
        // E2e tests spawn CLI subprocesses. Running multiple in
        // parallel can cause port conflicts on the mock server.
        singleFork: true,
      },
    },
  },
})
