import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { readGeneratedPnpmVersion } from "../../src/install/read-generated-pnpm-version.js"

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "cda-rgpv-"))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

const writePackageJson = (content: object | string): void => {
  writeFileSync(
    join(dir, "package.json"),
    typeof content === "string" ? content : JSON.stringify(content),
  )
}

describe("readGeneratedPnpmVersion", () => {
  it("returns the version from a pnpm@<version> packageManager field", () => {
    writePackageJson({ packageManager: "pnpm@11.0.0" })
    expect(readGeneratedPnpmVersion(dir)).toBe("11.0.0")
  })

  it("accepts a version with a prerelease suffix", () => {
    writePackageJson({ packageManager: "pnpm@11.0.0-rc.1" })
    expect(readGeneratedPnpmVersion(dir)).toBe("11.0.0-rc.1")
  })

  it("accepts a version with a prerelease tag like alpha.1", () => {
    writePackageJson({ packageManager: "pnpm@11.0.0-alpha.1" })
    expect(readGeneratedPnpmVersion(dir)).toBe("11.0.0-alpha.1")
  })

  it("accepts a version with a build-metadata suffix", () => {
    writePackageJson({ packageManager: "pnpm@11.0.0+sha.abc123" })
    expect(readGeneratedPnpmVersion(dir)).toBe("11.0.0+sha.abc123")
  })

  it("accepts a version with both prerelease and build-metadata", () => {
    writePackageJson({ packageManager: "pnpm@11.0.0-rc.1+build.7" })
    expect(readGeneratedPnpmVersion(dir)).toBe("11.0.0-rc.1+build.7")
  })

  it("ignores any trailing shell metacharacters and parses only the version segment", () => {
    // The semver regex is anchored at the start and accepts
    // only the version core plus valid semver suffixes. Any
    // characters after the semver shape (including shell
    // metacharacters) are ignored — they are not part of the
    // version we read. The security boundary for the recovery
    // command is the quoting helper, not the parser: the
    // parser extracts the version, and the recovery command
    // routes that version through `quoteForShell` /
    // `quoteForCmd` so a malicious version cannot inject a
    // shell command.
    //
    // This test pins the parser's contract: it returns just
    // the valid version, even when the field carries
    // metacharacters after it. The recovery quoting is
    // covered in `recovery.test.ts`.
    writePackageJson({ packageManager: "pnpm@11.0.0; rm -rf /" })
    expect(readGeneratedPnpmVersion(dir)).toBe("11.0.0")
  })

  it("ignores other fields and reads only packageManager", () => {
    writePackageJson({
      name: "saas-template",
      version: "0.0.0",
      dependencies: { next: "14.0.0" },
      packageManager: "pnpm@11.0.0",
    })
    expect(readGeneratedPnpmVersion(dir)).toBe("11.0.0")
  })

  it("throws source_failed when the packageManager field is missing", () => {
    writePackageJson({ name: "saas-template" })
    expect(() => readGeneratedPnpmVersion(dir)).toThrow(
      /no packageManager field/,
    )
  })

  it("throws source_failed when the packageManager field is not pnpm", () => {
    writePackageJson({ packageManager: "yarn@4.0.0" })
    expect(() => readGeneratedPnpmVersion(dir)).toThrow(
      /expected "pnpm@<version>"/,
    )
  })

  it("throws source_failed when the packageManager field is malformed", () => {
    writePackageJson({ packageManager: "" })
    expect(() => readGeneratedPnpmVersion(dir)).toThrow(
      /no packageManager field/,
    )
  })

  it("throws source_failed when package.json does not exist", () => {
    // dir is empty; no package.json
    expect(() => readGeneratedPnpmVersion(dir)).toThrow()
    mkdirSync(join(dir, "src"), { recursive: true })
    expect(() => readGeneratedPnpmVersion(dir)).toThrow()
  })
})
