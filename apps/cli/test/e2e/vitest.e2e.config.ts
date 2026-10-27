import { createRequire } from "node:module"
import { defineConfig } from "vitest/config"

const require = createRequire(import.meta.url)
const pkg = require("../../package.json") as { version: string }

export default defineConfig({
  define: {
    "process.env.CLI_PACKAGE_VERSION": JSON.stringify(pkg.version),
  },
  test: {
    environment: "node",
    include: ["test/e2e/**/*.test.ts"],
    testTimeout: 10 * 60_000,
    hookTimeout: 10 * 60_000,
    pool: "forks",
    fileParallelism: false,
  },
})
