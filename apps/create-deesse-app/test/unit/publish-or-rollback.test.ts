import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { publishOrRollback } from "../../src/extract/publish-or-rollback.js"

const makeTempDirWithFile = (name: string, content: string): string => {
  const dir = mkdtempSync(join(tmpdir(), "cda-pub-"))
  writeFileSync(join(dir, name), content)
  return dir
}

beforeEach(() => {
  // Make sure no previous test left a mock installed.
  vi.unmock("node:fs/promises")
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unmock("node:fs/promises")
})

describe("publishOrRollback", () => {
  it("renames tempDir into destination on the happy path", async () => {
    const tempDir = makeTempDirWithFile("LICENSE", "MIT")
    const parent = mkdtempSync(join(tmpdir(), "cda-pub-parent-"))
    const destination = join(parent, "my-app")
    const tarball = join(parent, "fixture.tgz")
    writeFileSync(tarball, "x")

    await publishOrRollback({ tempDir, destination, tarballPath: tarball })

    expect(existsSync(destination)).toBe(true)
    expect(existsSync(join(destination, "LICENSE"))).toBe(true)
    expect(readFileSync(join(destination, "LICENSE"), "utf8")).toBe("MIT")
    expect(existsSync(tempDir)).toBe(false)
    expect(existsSync(tarball)).toBe(false) // best-effort cleanup
    rmSync(parent, { recursive: true, force: true })
  })

  it("refuses to overwrite an existing destination (real on-disk race)", async () => {
    const tempDir = makeTempDirWithFile("LICENSE", "MIT")
    const parent = mkdtempSync(join(tmpdir(), "cda-pub-parent-"))
    const destination = join(parent, "my-app")
    // Pre-existing destination with content we MUST NOT overwrite.
    mkdirSync(destination, { recursive: true })
    writeFileSync(join(destination, "USER_DATA.txt"), "important")
    const tarball = join(parent, "fixture.tgz")
    writeFileSync(tarball, "x")

    await expect(
      publishOrRollback({ tempDir, destination, tarballPath: tarball }),
    ).rejects.toThrowError(
      expect.objectContaining({ code: "destination_exists" }) as unknown as Error,
    )

    // Destination content is intact.
    expect(readFileSync(join(destination, "USER_DATA.txt"), "utf8")).toBe(
      "important",
    )
    // tempDir is cleaned up.
    expect(existsSync(tempDir)).toBe(false)
    // The probe file the function would have created is NOT present
    // (because the wx open failed on the existing destination and we
    // never reached the unlink step).
    const probe = readdirSync(parent).find((f) => f.startsWith(".cda-probe-"))
    expect(probe).toBeUndefined()

    rmSync(parent, { recursive: true, force: true })
  })

  it("refuses to overwrite a dangling symlink at the destination", async () => {
    if (process.platform === "win32") {
      // Skip: creating a symlink on Windows requires
      // SeCreateSymbolicLinkPrivilege or Developer Mode. The non-symlink
      // tests cover the O_EXCL atomicity path on every platform.
      return
    }
    const tempDir = makeTempDirWithFile("LICENSE", "MIT")
    const parent = mkdtempSync(join(tmpdir(), "cda-pub-parent-"))
    const destination = join(parent, "my-app")
    // Destination is a symlink whose target does not exist.
    // `lstat` sees the symlink; the O_EXCL probe must fail with EEXIST.
    const { symlinkSync } = await import("node:fs")
    symlinkSync(join(parent, "no-such-target"), destination)
    const tarball = join(parent, "fixture.tgz")
    writeFileSync(tarball, "x")

    await expect(
      publishOrRollback({ tempDir, destination, tarballPath: tarball }),
    ).rejects.toThrowError(
      expect.objectContaining({ code: "destination_exists" }) as unknown as Error,
    )
    // tempDir is cleaned up by the rollback path.
    expect(existsSync(tempDir)).toBe(false)
    // We do NOT assert the symlink is still present: per rename(2),
    // a POSIX rename can replace a symbolic link atomically (and our
    // errno mapping covers EEXIST / ENOTDIR / EPERM, so the throw
    // is consistent). Windows refuses the rename with EPERM and
    // leaves the symlink in place, but this test is skipped on
    // Windows for privilege reasons, so the post-state is not
    // asserted here.

    rmSync(parent, { recursive: true, force: true })
  })

  it("simulates a process racing in between the probe and the rename", async () => {
    // This is the case the senior review specifically called out: the
    // destination appears AFTER validateDestination but BEFORE we publish.
    // We simulate that by letting the O_EXCL probe succeed, then creating
    // the destination for real on disk between the probe close and the
    // rename call, and then performing the REAL rename. The rename then
    // fails with EEXIST (or ENOTEMPTY) and we must map that to
    // destination_exists.
    const tempDir = makeTempDirWithFile("LICENSE", "MIT")
    const parent = mkdtempSync(join(tmpdir(), "cda-pub-parent-"))
    const destination = join(parent, "my-app")
    const tarball = join(parent, "fixture.tgz")
    writeFileSync(tarball, "x")

    // Wrap node:fs/promises so we can hook between the close() and rename().
    const realFs = await vi.importActual<typeof import("node:fs/promises")>(
      "node:fs/promises",
    )
    const racer = {
      ...realFs,
      rename: vi.fn(async (src: string, dst: string) => {
        // Race: just before rename, the destination appears with a
        // pre-existing file. The real rename will then fail with EEXIST.
        mkdirSync(dst, { recursive: true })
        writeFileSync(join(dst, "USER_DATA.txt"), "important")
        return realFs.rename(src, dst)
      }),
    }
    vi.doMock("node:fs/promises", () => racer)

    // Re-import so the publish-or-rollback module picks up the mock.
    vi.resetModules()
    const { publishOrRollback: publishWithMock } = await import(
      "../../src/extract/publish-or-rollback.js"
    )

    await expect(
      publishWithMock({ tempDir, destination, tarballPath: tarball }),
    ).rejects.toThrowError(
      expect.objectContaining({ code: "destination_exists" }) as unknown as Error,
    )

    // The user's pre-existing content is intact.
    expect(readFileSync(join(destination, "USER_DATA.txt"), "utf8")).toBe(
      "important",
    )
    // The LICENSE from the staged tempDir was NOT copied over.
    expect(existsSync(join(destination, "LICENSE"))).toBe(false)
    // tempDir is cleaned up.
    expect(existsSync(tempDir)).toBe(false)

    rmSync(parent, { recursive: true, force: true })
  })
})
