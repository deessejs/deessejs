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
  // Vitest 4 worker processes (both `threads` and `forks` pools) drop
  // env vars that are not explicitly declared in `test.env`. Without
  // this, tests run with `process.env.DATABASE_URL === undefined`
  // despite the env block setting it on the GitHub Actions step /
  // shell. Per vitest.dev/config/env: "These variables will not be
  // available in the main process (in globalSetup, for example)" —
  // the inverse is also true: anything not declared here is not
  // guaranteed to reach the worker. Snapshot the env vars our tests
  // actually read at config-load time (the parent shell env) and
  // forward them to workers. Vars NOT in this allowlist are not
  // exposed to tests, which is the safer default for CI (no leaked
  // secrets from accidental `process.env` reads in test files).
  env: {} as Record<string, string | undefined>,
  // `threads` pool default is fine in dev. We keep the documented
  // Vitest 4 default rather than overriding here — see the
  // integration test infra notes in PR #75.
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

// Env vars that integration tests need to see in worker processes.
// Centralised here so adding a new CI-required var doesn't require
// editing every package's vitest.config.ts.
const FORWARDED_ENV_VARS = [
  "NODE_ENV",
  "DATABASE_URL",
  "TEST_DATABASE_URL",
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "AUTH_SECRET",
  "ALLOWED_ORIGINS",
  "RATE_LIMIT_PER_MINUTE",
  "GITHUB_TOKEN",
  "RESEND_API_KEY",
  "MAIL_TRANSPORT",
] as const

export const vitestConfig = (overrides: VitestOverrides = {}) => {
  const merged = { ...DEFAULT_OVERRIDES, ...overrides }
  // Snapshot the parent shell env at config-load time and forward
  // the keys in FORWARDED_ENV_VARS. Tests that need a value not in
  // this list should add it here and update the integration test
  // config — do not read `process.env` directly in test files,
  // because the worker pool may not propagate unlisted keys.
  const forwardedEnv: Record<string, string | undefined> = {}
  for (const key of FORWARDED_ENV_VARS) {
    const value = process.env[key]
    if (value !== undefined) forwardedEnv[key] = value
  }
  const testConfig: Record<string, unknown> = {
    include: merged.include,
    testTimeout: merged.testTimeout,
    hookTimeout: merged.hookTimeout,
    pool: merged.pool,
    setupFiles: merged.setupFiles,
    clearMocks: merged.clearMocks,
    restoreMocks: merged.restoreMocks,
    environment: merged.environment,
    env: forwardedEnv,
  }
  if (merged.coverage === true) {
    testConfig.coverage = DEFAULT_COVERAGE
  } else if (merged.coverage && typeof merged.coverage === "object") {
    testConfig.coverage = { ...DEFAULT_COVERAGE, ...merged.coverage }
  }
  return defineConfig({ test: testConfig })
}
