import { createRequire } from "node:module"
import { defineConfig } from "vitest/config"

// Mirrors the `define` block in apps/cli/tsup.config.ts so that tests
// resolve the same way the bundled CLI does. Without this, vitest
// would see `process.env.CLI_PACKAGE_VERSION` as `undefined` (Node's
// real process.env does not carry the field — it is a build-time
// substitution) and `readPackageVersion()` would return undefined.
const require = createRequire(import.meta.url)
const packageJson: unknown = require("./package.json")
const packageVersion =
  typeof packageJson === "object" &&
  packageJson !== null &&
  "version" in packageJson &&
  typeof packageJson.version === "string"
    ? packageJson.version
    : (() => {
        throw new Error("package.json must contain a string version")
      })()

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
