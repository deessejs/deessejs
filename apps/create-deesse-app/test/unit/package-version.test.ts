import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { readPackageVersion } from "../../src/utils/package-version.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgPath = join(__dirname, "..", "..", "package.json")

describe("readPackageVersion", () => {
  it("returns the version from package.json (drift guard)", () => {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
      version: string
    }
    // tsup and vitest both inject this env var from package.json at
    // build/test time. If this assertion ever fails, the injection
    // configuration in tsup.config.ts or vitest.config.ts has regressed.
    expect(readPackageVersion()).toBe(pkg.version)
  })

  it("does NOT return the literal string 'add' (regression guard for --version bug)", () => {
    expect(readPackageVersion()).not.toBe("add")
  })
})
