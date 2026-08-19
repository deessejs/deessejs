import { defineConfig } from "vitest/config"

/**
 * Spike Vitest config (ADR-015).
 *
 * Runs the spike test against the local server. The full e2e suite
 * (after the spike) will use a separate config. This one is
 * scoped to the spike and is deleted once the spike graduates.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/e2e/spike.spec.ts"],
    testTimeout: 180_000,
    hookTimeout: 180_000,
    globalSetup: ["./test/e2e/helpers/global-setup.ts"],
    pool: "forks",
    poolOptions: {
      forks: {
        // Single fork. The local server listens on a port. A second
        // fork would race on the port unless we shared the server.
        singleFork: true,
      },
    },
  },
})
