import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import * as tar from "tar"
import { describe, expect, it } from "vitest"

import { extractTarball } from "../../src/extract/extract.js"
import { validateEntries } from "../../src/extract/validate-entries.js"

const REPO = "saas-template"
const SHA = "abcdef0123456789abcdef0123456789abcdef01"
const PREFIX_DIR = `${REPO}-${SHA}`

const buildFixtureTarball = (
  entries: Array<{ name: string; content: string }>,
): { tarPath: string; stageDir: string } => {
  const stageDir = mkdtempSync(join(tmpdir(), "cda-stage-"))
  const inner = join(stageDir, PREFIX_DIR)
  mkdirSync(inner, { recursive: true })
  for (const e of entries) {
    const full = join(inner, e.name)
    mkdirSync(join(full, ".."), { recursive: true })
    writeFileSync(full, e.content)
  }
  const tarPath = join(stageDir, "fixture.tgz")
  // tar.c with sync:true is synchronous and the file is fully written and
  // closed before this returns. This avoids the unhandled-rejection race
  // where a later test cleans up the stage dir while tar's stream is
  // still reading from a file descriptor.
  tar.c({ gzip: true, file: tarPath, cwd: stageDir, sync: true }, [PREFIX_DIR])
  return { tarPath, stageDir }
}

const buildBadPrefixTarball = (): { tarPath: string; stageDir: string } => {
  const stageDir = mkdtempSync(join(tmpdir(), "cda-stage-"))
  const otherPrefix = "wrong-name-prefix"
  mkdirSync(join(stageDir, otherPrefix), { recursive: true })
  writeFileSync(join(stageDir, otherPrefix, "LICENSE"), "MIT")
  const tarPath = join(stageDir, "fixture.tgz")
  tar.c({ gzip: true, file: tarPath, cwd: stageDir, sync: true }, [otherPrefix])
  return { tarPath, stageDir }
}

const cleanup = (stageDir: string) =>
  rmSync(stageDir, { recursive: true, force: true })

describe("validateEntries (pass 1)", () => {
  it("accepts a well-formed archive and returns the normalized entry list", async () => {
    const { tarPath, stageDir } = buildFixtureTarball([
      { name: "LICENSE", content: "MIT" },
      { name: "package.json", content: '{"name":"x"}' },
    ])
    const result = await validateEntries({
      tarballPath: tarPath,
      sha: SHA,
      repo: REPO,
    })
    // The dry-run plan consumes the entry list, so the
    // return shape changed from `void` to `{ entries }`.
    // The two file entries are present; the empty top-level
    // prefix entry is filtered out.
    expect(result.entries.map((e) => e.path).sort()).toEqual([
      "LICENSE",
      "package.json",
    ])
    cleanup(stageDir)
  })

  it("rejects when entries do not start with the expected prefix", async () => {
    const { tarPath, stageDir } = buildBadPrefixTarball()
    try {
      await expect(
        validateEntries({ tarballPath: tarPath, sha: SHA, repo: REPO }),
      ).rejects.toThrowError(expect.objectContaining({ code: "unsafe_archive" }) as unknown as Error)
    } finally {
      cleanup(stageDir)
    }
  })
})

describe("extractTarball (pass 2)", () => {
  it("strips the prefix and extracts LICENSE and package.json directly to tempDir", async () => {
    const { tarPath, stageDir } = buildFixtureTarball([
      { name: "LICENSE", content: "MIT" },
      { name: "package.json", content: '{"name":"old"}' },
    ])
    const tempDir = mkdtempSync(join(tmpdir(), "cda-extract-"))
    await extractTarball({
      tarballPath: tarPath,
      tempDir,
      sha: SHA,
      repo: REPO,
    })
    expect(existsSync(join(tempDir, "LICENSE"))).toBe(true)
    expect(existsSync(join(tempDir, "package.json"))).toBe(true)
    expect(existsSync(join(tempDir, PREFIX_DIR))).toBe(false)
    rmSync(tempDir, { recursive: true, force: true })
    cleanup(stageDir)
  })
})