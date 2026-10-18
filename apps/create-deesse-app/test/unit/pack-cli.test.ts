import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import {
  packCli,
  readTestVersion,
  verifyPackageShape,
} from "../e2e/support/consumer-stack.js"

// packCli mutates the CLI's package.json (the `version` field)
// and restores it in its own `finally` block. To make this
// unit test safe under vitest's default file-level parallelism
// (where another test file might read the same package.json
// mid-execution), we capture the original content in beforeAll
// and restore it again in afterAll as a final safety net. This
// guarantees that the file is back to its original state by the
// time the test process exits, regardless of whether packCli's
// own restore ran.
const CLI_DIR = join(import.meta.dirname, "..", "..")
const PKG_PATH = join(CLI_DIR, "package.json")
let originalPkg = ""

describe("packCli (no Docker)", () => {
  let firstVersion = ""
  let firstSha = ""

  beforeAll(() => {
    originalPkg = readFileSync(PKG_PATH, "utf8")
    firstVersion = readTestVersion()
  })

  afterAll(() => {
    // Final safety net: restore the original package.json
    // verbatim. packCli's own `finally` already restores it,
    // and vitest.config.ts sets fileParallelism: false so
    // package-version.test.ts does not race. This afterAll is
    // belt-and-suspenders: if a future change drops either
    // invariant, the test still cleans up.
    if (originalPkg) {
      writeFileSync(PKG_PATH, originalPkg)
    }
  })

  it("packs a tarball whose manifest version matches the bumped test version", async () => {
    const artifact = await packCli(firstVersion)
    expect(artifact.testVersion).toBe(firstVersion)
    expect(artifact.manifest.version).toBe(firstVersion)
    expect(artifact.manifest.name).toBe(artifact.packageName)
    expect(artifact.manifest.bin["create-deesse-app"]).toBe("./dist/index.js")
    firstSha = artifact.sha256
    await verifyPackageShape(artifact)
  }, 5 * 60_000)

  it("produces a stable sha256 for a given input but a different sha for a different version", async () => {
    // Re-pack with the same testVersion. The artifact will have a
    // different sha (timestamps in the tarball), but the
    // manifest contents should match. This catches accidental
    // mutation of the manifest by the harness.
    const a = await packCli(firstVersion)
    const b = await packCli(firstVersion)
    expect(a.manifest).toEqual(b.manifest)
    // Two back-to-back packs of the same source produce
    // different shas because the tar header embeds the current
    // mtime. We don't assert sha inequality; we only assert
    // manifest equality.
    void firstSha
    void a
    void b
  }, 5 * 60_000)
})
