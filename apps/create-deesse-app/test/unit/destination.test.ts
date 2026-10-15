import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { validateDestination } from "../../src/destination/validate.js"

describe("validateDestination", () => {
  it("passes when the destination does not exist", () => {
    const base = mkdtempSync(join(tmpdir(), "cda-dest-"))
    const fresh = join(base, "does-not-exist")
    expect(() => validateDestination(fresh)).not.toThrow()
    rmSync(base, { recursive: true, force: true })
  })

  it("rejects an existing directory (even empty)", () => {
    const base = mkdtempSync(join(tmpdir(), "cda-dest-"))
    expect(() => validateDestination(base)).toThrow(/already exists/)
    rmSync(base, { recursive: true, force: true })
  })

  it("rejects an existing non-empty directory", () => {
    const base = mkdtempSync(join(tmpdir(), "cda-dest-"))
    writeFileSync(join(base, "sentinel"), "x")
    expect(() => validateDestination(base)).toThrow(/already exists/)
    rmSync(base, { recursive: true, force: true })
  })

  it("rejects an existing file (not a directory)", () => {
    const base = mkdtempSync(join(tmpdir(), "cda-dest-"))
    const file = join(base, "some-file")
    writeFileSync(file, "x")
    expect(() => validateDestination(file)).toThrow(/already exists/)
    rmSync(base, { recursive: true, force: true })
  })
})