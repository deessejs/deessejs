import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

// We need to control os.homedir() before importing the cache module.
// vitest's vi.mock is hoisted, so we mock the module that owns it.
const FAKE_HOME = join(tmpdir(), `deessejs-test-${Date.now()}-${Math.random()}`)

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>()
  return {
    ...actual,
    homedir: () => FAKE_HOME,
  }
})

const { readDiskCache, writeDiskCache } = await import(
  "../../src/cache/index.js"
)
const { cacheDir } = await import("../../src/cache/location.js")
const CACHE_DIR = cacheDir()

describe("disk cache", () => {
  beforeEach(() => {
    if (existsSync(FAKE_HOME)) rmSync(FAKE_HOME, { recursive: true })
    mkdirSync(FAKE_HOME, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(FAKE_HOME)) rmSync(FAKE_HOME, { recursive: true })
  })

  it("returns null when the file does not exist", () => {
    expect(readDiskCache("missing.json")).toBeNull()
  })

  it("writes and reads back an entry", () => {
    const body = { templates: [{ slug: "x", name: "X" }] }
    writeDiskCache("templates.json", body, 'W/"v1"')

    const entry = readDiskCache<typeof body>("templates.json")
    expect(entry).not.toBeNull()
    expect(entry?.etag).toBe('W/"v1"')
    expect(entry?.body).toEqual(body)
    expect(entry?.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it("returns null for a corrupted file and leaves it on disk", () => {
    const target = join(CACHE_DIR, "corrupt.json")
    mkdirSync(CACHE_DIR, { recursive: true })
    writeFileSync(target, "{not valid json", "utf8")

    expect(readDiskCache("corrupt.json")).toBeNull()
    // The corrupt file is preserved so the user can inspect or back it up.
    expect(existsSync(target)).toBe(true)
  })

  it("uses ~/.deessejs/ as the cache directory", () => {
    expect(CACHE_DIR).toBe(join(FAKE_HOME, ".deessejs"))
  })

  it("overwrites an existing entry on subsequent writes", () => {
    writeDiskCache("templates.json", { v: 1 }, 'W/"v1"')
    writeDiskCache("templates.json", { v: 2 }, 'W/"v2"')

    const entry = readDiskCache<{ v: number }>("templates.json")
    expect(entry?.body).toEqual({ v: 2 })
    expect(entry?.etag).toBe('W/"v2"')
  })
})
