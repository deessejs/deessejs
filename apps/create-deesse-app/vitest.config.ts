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
    // The e2e journey needs Docker (Testcontainers) and longer
    // timeouts, and is run via `pnpm test:e2e` against a separate
    // vitest config. Excluding it here keeps `pnpm test` fast and
    // free of Docker requirements.
    exclude: ["node_modules/**", "test/e2e/**"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: "forks",
    // pack-cli.test.ts mutates the CLI's package.json (the
    // `version` field) and restores it in afterAll. The
    // package-version.test.ts drift-guard reads the same file.
    // Under default file-level parallelism the two can run
    // concurrently in separate forks, and package-version can
    // read the bumped version mid-mutation. Serializing the
    // suite keeps the drift-guard reliable; the unit suite is
    // fast (~10 s) so the cost is negligible.
    fileParallelism: false,
  },
})