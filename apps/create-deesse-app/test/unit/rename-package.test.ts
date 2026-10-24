import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { CliError } from "../../src/errors/index.js"
import { renameRootPackage } from "../../src/destination/rename-package.js"

describe("renameRootPackage", () => {
  const makeTempDirWithPkg = (originalName: string): string => {
    const dir = mkdtempSync(join(tmpdir(), "cda-rename-"))
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: originalName, version: "1.0.0" }, null, 2) + "\n",
    )
    return dir
  }

  it("renames the root package.json and writes atomically", () => {
    const dir = makeTempDirWithPkg("old-name")
    const result = renameRootPackage({ tempDir: dir, newName: "new-name" })
    expect(result).toEqual({ previous: "old-name", current: "new-name" })
    const updated = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"))
    expect(updated.name).toBe("new-name")
    expect(updated.version).toBe("1.0.0")
    rmSync(dir, { recursive: true, force: true })
  })

  it("preserves other keys", () => {
    const dir = mkdtempSync(join(tmpdir(), "cda-rename-"))
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify(
        {
          name: "old",
          scripts: { dev: "next" },
          dependencies: { next: "^1.0.0" },
        },
        null,
        2,
      ) + "\n",
    )
    renameRootPackage({ tempDir: dir, newName: "new" })
    const updated = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"))
    expect(updated.scripts).toEqual({ dev: "next" })
    expect(updated.dependencies).toEqual({ next: "^1.0.0" })
    rmSync(dir, { recursive: true, force: true })
  })

  it("is a no-op when newName equals the current name", () => {
    const dir = makeTempDirWithPkg("same-name")
    const result = renameRootPackage({ tempDir: dir, newName: "same-name" })
    expect(result).toEqual({ previous: "same-name", current: "same-name" })
    rmSync(dir, { recursive: true, force: true })
  })

  it("throws when package.json is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "cda-rename-"))
    try {
      expect(() => renameRootPackage({ tempDir: dir, newName: "foo" })).toThrow(
        Error,
      )
      expect(() => renameRootPackage({ tempDir: dir, newName: "foo" })).toThrow(
        /template is missing root package\.json/,
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("throws when package.json is not valid JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "cda-rename-"))
    writeFileSync(join(dir, "package.json"), "{not valid")
    try {
      expect(() => renameRootPackage({ tempDir: dir, newName: "foo" })).toThrow(
        /template package\.json is not valid JSON/,
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("throws when package.json has no string name", () => {
    const dir = mkdtempSync(join(tmpdir(), "cda-rename-"))
    writeFileSync(join(dir, "package.json"), JSON.stringify({ version: "1" }))
    try {
      expect(() => renameRootPackage({ tempDir: dir, newName: "foo" })).toThrow(
        /no string `name`/,
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("rejects invalid newName with invalid_name CliError", () => {
    const dir = makeTempDirWithPkg("old")
    try {
      expect(() =>
        renameRootPackage({ tempDir: dir, newName: "Bad..Name" }),
      ).toThrow(/Bad\.\.Name/)
      try {
        renameRootPackage({ tempDir: dir, newName: "Bad..Name" })
      } catch (err) {
        expect(err).toBeInstanceOf(CliError)
        expect((err as CliError).code).toBe("invalid_name")
      }
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})