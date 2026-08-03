import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { CLI_PACKAGE_VERSION } from "../../src/cli-self-version.js"

/**
 * Drift check: CLI_PACKAGE_VERSION is hand-baked into the bundle (we
 * can't resolve apps/cli/package.json at runtime after tsup), so the
 * developer has to update both files on a version bump. This test
 * fails CI if they forget.
 *
 * The test resolves the monorepo root from this file's location
 * (apps/cli/test/unit/cli-self-version.test.ts → apps/cli/), then
 * reads apps/cli/package.json synchronously. The package.json is in
 * git and lives next to the source, so this is reliable.
 */
const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJsonPath = resolve(__dirname, "..", "..", "package.json")

describe("CLI version drift", () => {
  it("CLI_PACKAGE_VERSION matches apps/cli/package.json", () => {
    const raw = readFileSync(packageJsonPath, "utf8")
    const parsed = JSON.parse(raw) as { version?: string }
    expect(parsed.version).toBeDefined()
    expect(CLI_PACKAGE_VERSION).toBe(parsed.version)
  })
})
