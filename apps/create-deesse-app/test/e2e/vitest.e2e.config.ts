import { createRequire } from "node:module"
import { defineConfig } from "vitest/config"

// Same `define` block as the unit-test config so any code that reads
// process.env.CREATE_DEESSE_APP_VERSION sees the real value during the
// e2e harness. The harness also reads package.json directly when it
// packs the CLI, so the value must match.
const require = createRequire(import.meta.url)
const pkg = require("../../package.json") as { version: string }

export default defineConfig({
  define: {
    "process.env.CREATE_DEESSE_APP_VERSION": JSON.stringify(pkg.version),
  },
  test: {
    environment: "node",
    // The full e2e journey requires Testcontainers (Verdaccio, PostgreSQL,
    // a real consumer). That requires a Docker daemon, which is only
    // available on the Linux CI job. Windows/macOS run a separate
    // smoke-only test file that does not need Docker.
    include: ["test/e2e/**/*.test.ts"],
    exclude: ["test/e2e/smoke/**/*.test.ts", "node_modules/**"],
    testTimeout: 10 * 60_000, // 10 min per test, generous for cold install
    hookTimeout: 10 * 60_000,
    pool: "forks",
    // One worker: Testcontainers + the consumer network is a single shared
    // resource. Running multiple journeys in parallel would race for the
    // same Docker daemon and produce flaky evidence.
    fileParallelism: false,
  },
})
