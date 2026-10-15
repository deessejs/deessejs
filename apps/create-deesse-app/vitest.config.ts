import { createRequire } from "node:module"
import { defineConfig } from "vitest/config"

// Mirrors the `define` block in apps/create-deesse-app/tsup.config.ts so that
// tests resolve the same way the bundled CLI does. Without this, vitest
// would see `process.env.CREATE_DEESSE_APP_VERSION` as `undefined` (Node's
// real process.env does not carry the field — it is a build-time
// substitution) and any version-reading helper would return undefined.
const require = createRequire(import.meta.url)
const pkg = require("./package.json") as { version: string }

export default defineConfig({
  define: {
    "process.env.CREATE_DEESSE_APP_VERSION": JSON.stringify(pkg.version),
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: "forks",
  },
})