import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { readPackageVersion } from "../../src/api/self-version.js"

/**
 * Drift check: readPackageVersion is injected at build time from
 * apps/cli/package.json via tsup `define` (see apps/cli/tsup.config.ts).
 * vitest's define is configured to mirror the substitution so the same
 * value resolves under test. This test pins the invariant in three
 * shapes:
 *
 * 1. The value is defined (catches a tsup misconfiguration where the
 *    `define` block is dropped or mistyped).
 * 2. The value matches apps/cli/package.json (catches a drift between
 *    the source of truth and the build-time substitution, including
 *    a stale vitest config that points at the wrong file).
 * 3. The value is a valid X.Y.Z semver (catches a substitution that
 *    resolved to `undefined`, an empty string, or a tag-shaped value
 *    like `v2.0.0` that the version probe cannot compare).
 *
 * The package.json is read by path relative to this file
 * (apps/cli/test/unit/cli-self-version.test.ts → apps/cli/package.json).
 * The path is in git and lives next to the source, so the read is
 * reliable across local dev and CI.
 */
const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJsonPath = resolve(__dirname, "..", "..", "package.json")

const SEMVER_RE = /^\d+\.\d+\.\d+$/

describe("CLI version injection", () => {
  it("readPackageVersion is defined", () => {
    const local = readPackageVersion()
    expect(local).toBeDefined()
    expect(local).not.toBe("")
  })

  it("readPackageVersion matches apps/cli/package.json", () => {
    const raw = readFileSync(packageJsonPath, "utf8")
    const parsed = JSON.parse(raw) as { version?: string }
    expect(parsed.version).toBeDefined()
    expect(readPackageVersion()).toBe(parsed.version)
  })

  it("readPackageVersion is a valid X.Y.Z semver", () => {
    const local = readPackageVersion()
    expect(local).toMatch(SEMVER_RE)
  })
})
