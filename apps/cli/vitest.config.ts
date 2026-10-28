import { createRequire } from "node:module"
import { defineConfig } from "vitest/config"

// Mirrors the `define` block in apps/cli/tsup.config.ts so that tests
// resolve the same way the bundled CLI does. Without this, vitest
// would see `process.env.CLI_PACKAGE_VERSION` as `undefined` (Node's
// real process.env does not carry the field — it is a build-time
// substitution) and `readPackageVersion()` would return undefined.
const require = createRequire(import.meta.url)
const packageJson: unknown = require("./package.json")
const packageVersion = readPackageVersion(packageJson)

function readPackageVersion(value: unknown): string {
  if (typeof value !== "object" || value === null) {
    throw new Error("package.json must contain a string version")
  }
  if (!("version" in value) || typeof value.version !== "string") {
    throw new Error("package.json must contain a string version")
  }
  return value.version
}

export default defineConfig({
  define: {
    "process.env.CLI_PACKAGE_VERSION": JSON.stringify(packageVersion),
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    exclude: ["node_modules/**", "test/e2e/**"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: "forks",
  },
})
