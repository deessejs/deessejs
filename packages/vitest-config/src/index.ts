import { defineConfig } from "vitest/config"

export type VitestOverrides = {
  include?: string[]
  testTimeout?: number
  hookTimeout?: number
  pool?: "threads" | "forks" | "vmThreads"
  setupFiles?: string[]
  coverage?: boolean | object
  clearMocks?: boolean
  restoreMocks?: boolean
  environment?: "node" | "jsdom" | "happy-dom"
}

const DEFAULT_OVERRIDES = {
  include: ["tests/**/*.test.ts"],
  testTimeout: 5_000,
  hookTimeout: 10_000,
  // Vitest 4 `threads` (worker_threads) does not reliably propagate the
  // GitHub Actions step `env:` block into worker processes: tests then
  // see `process.env.DATABASE_URL === undefined` even though the main
  // process inherited it correctly, which surfaced as the strict 200
  // assertion in `packages/api/tests/integration/system/health.test.ts`
  // failing while the globalSetup probe (running in the main process)
  // still saw the env. `forks` (child_process) gives each test file a
  // fresh `process.env` copy of the parent shell env. Tracked under
  // vitest-dev/vitest#8769 (env-sync, fixed in 4.x) — but the fix only
  // re-syncs env at pool start, not after, so the worker_threads path
  // still drops late-bound env values. Switch to `forks` as the
  // defensive default; packages that need threads (e.g. for ESM module
  // caching) can override via the `VitestOverrides.pool` argument.
  pool: "forks" as const,
  setupFiles: ["@workspace/env/server"],
  coverage: false as const,
  clearMocks: true,
  restoreMocks: true,
  environment: "node" as const,
}

const DEFAULT_COVERAGE = {
  provider: "v8" as const,
  include: ["src/**/*.ts"],
  exclude: ["**/*.test.ts", "**/*.test.tsx", "**/dist/**", "**/*.d.ts"],
  thresholds: {
    lines: 80,
    branches: 75,
    functions: 80,
    statements: 80,
  },
}

export const vitestConfig = (overrides: VitestOverrides = {}) => {
  const merged = { ...DEFAULT_OVERRIDES, ...overrides }
  const testConfig: Record<string, unknown> = {
    include: merged.include,
    testTimeout: merged.testTimeout,
    hookTimeout: merged.hookTimeout,
    pool: merged.pool,
    setupFiles: merged.setupFiles,
    clearMocks: merged.clearMocks,
    restoreMocks: merged.restoreMocks,
    environment: merged.environment,
  }
  if (merged.coverage === true) {
    testConfig.coverage = DEFAULT_COVERAGE
  } else if (merged.coverage && typeof merged.coverage === "object") {
    testConfig.coverage = { ...DEFAULT_COVERAGE, ...merged.coverage }
  }
  return defineConfig({ test: testConfig })
}
