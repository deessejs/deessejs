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
  pool: "threads" as const,
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
