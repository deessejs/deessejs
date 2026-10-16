import { createRequire } from "node:module"
import { defineConfig } from "vitest/config"

const require = createRequire(import.meta.url)
const pkg = require("../../../package.json") as { version: string }

export default defineConfig({
  define: {
    "process.env.CREATE_DEESSE_APP_VERSION": JSON.stringify(pkg.version),
  },
  test: {
    environment: "node",
    // The native smoke runs the bundled CLI directly; no Docker, no
    // Testcontainers. Used by the Windows and macOS CI jobs and by
    // the local-dev quick check on any platform.
    include: ["test/e2e/smoke/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    pool: "forks",
  },
})
