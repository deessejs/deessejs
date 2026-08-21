import { defineConfig } from "vitest/config"

/**
 * Vitest config for the env package's unit test suite.
 *
 * Shared preset per ADR-009 §70-72: `tests/**/*.test.ts` glob,
 * `setupFiles: ["@workspace/env/server"]` (so the loader primes
 * `process.env` before tests read it), `threads` pool, 5s
 * testTimeout. The shared config in `@workspace/vitest-config`
 * is not yet implemented (ADR-011 is Proposed); the inline shape
 * here mirrors what the shared preset will provide.
 */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: ["@workspace/env/server"],
    pool: "threads",
    testTimeout: 5_000,
    hookTimeout: 10_000,
    clearMocks: true,
    restoreMocks: true,
    environment: "node",
  },
})