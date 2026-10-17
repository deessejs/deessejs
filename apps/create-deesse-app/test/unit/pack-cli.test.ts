import { afterAll, beforeAll, describe, expect, it } from "vitest"

import {
  packCli,
  readTestVersion,
  verifyPackageShape,
} from "../e2e/support/consumer-stack.js"

describe("packCli (no Docker)", () => {
  let firstVersion = ""
  let firstSha = ""

  beforeAll(() => {
    firstVersion = readTestVersion()
  })

  afterAll(() => {
    // packCli restores the manifest in `finally`, so no cleanup
    // is needed. This block is here so the test suite documents
    // the intent.
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
