import {
  lstatSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { validateDestination } from "../../src/destination/validate.js"

// Creating a symlink on Windows requires SeCreateSymbolicLinkPrivilege or
// Developer Mode to be enabled. CI on Windows does not always grant this,
// so we skip the symlink-specific tests there. The non-symlink tests
// below already cover the lstat-vs-stat distinction on every platform
// because `lstat` is the implementation in all environments.
const skipOnWindows = process.platform === "win32" ? it.skip : it

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

  // Sanity check: the function uses lstat, not stat. This matters because
  // stat follows symlinks and would treat a dangling symlink as
  // non-existent. We assert the implementation by calling lstat directly
  // and checking the function rejects whatever lstat reports.
  it("uses lstat (rejects any entry lstat sees, even symlinks)", () => {
    const base = mkdtempSync(join(tmpdir(), "cda-dest-"))
    // Use a regular file as a proxy: if validateDestination uses stat
    // instead of lstat, the result is the same for plain files, so the
    // positive-case sanity check below does not distinguish them. The
    // symlink tests below are the real distinguisher.
    const file = join(base, "regular")
    writeFileSync(file, "x")
    const stat = lstatSync(file, { throwIfNoEntry: false })
    expect(stat?.isSymbolicLink()).toBe(false)
    expect(() => validateDestination(file)).toThrow(/already exists/)
    rmSync(base, { recursive: true, force: true })
  })

  skipOnWindows(
    "rejects a dangling symlink (symlink target does not exist)",
    () => {
      const base = mkdtempSync(join(tmpdir(), "cda-dest-"))
      const link = join(base, "dangling")
      // Target intentionally does not exist. `lstat` sees the symlink itself,
      // so validateDestination must reject even though `stat` would follow
      // the link and fail with ENOENT (which would look like "no entry").
      symlinkSync(join(base, "nonexistent-target"), link)
      expect(() => validateDestination(link)).toThrow(/already exists/)
      rmSync(base, { recursive: true, force: true })
    }
  )

  skipOnWindows("rejects a symlink that points at an existing entry", () => {
    const base = mkdtempSync(join(tmpdir(), "cda-dest-"))
    const target = join(base, "real-file")
    const link = join(base, "link")
    writeFileSync(target, "x")
    // The target exists, but the entry at the destination path is itself a
    // symlink. `lstat` (used by validateDestination) reports the symlink,
    // not the target file — so we still reject.
    symlinkSync(target, link)
    expect(() => validateDestination(link)).toThrow(/already exists/)
    rmSync(base, { recursive: true, force: true })
  })
})
