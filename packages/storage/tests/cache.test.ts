import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import {
  readCache,
  writeCache,
  purgeCache,
  readCatalogue,
  writeCatalogue,
  descriptorCachePath,
  httpCacheKey,
} from "../src/index.js"
import { catalogPath, itemCachePath, cacheRoot } from "../src/internal/paths.js"
import { lockWrite } from "../src/internal/lock.js"

import type { CachedDescriptor } from "../src/cache.js"
import { _internalItemKey } from "../src/cache.js"

let scratch: string

beforeEach(() => {
  scratch = mkdtempSync(path.join(tmpdir(), "deessejs-storage-"))
})

afterEach(() => {
  rmSync(scratch, { recursive: true, force: true })
})

describe("paths", () => {
  it("itemCachePath is provider-namespaced", () => {
    const p = itemCachePath("git-tags", "saas-starter", "v1.4.0")
    expect(p).toContain("items")
    expect(p).toContain("git-tags")
    expect(p).toContain("saas-starter")
    expect(p).toContain("v1.4.0.json")
  })

  it("catalogPath ends with catalog.json", () => {
    expect(catalogPath()).toMatch(/catalog\.json$/)
  })

  it("cacheRoot picks an OS-respecting path", () => {
    const root = cacheRoot()
    expect(typeof root).toBe("string")
    expect(root.length).toBeGreaterThan(0)
  })
})

describe("lockWrite (atomic)", () => {
  it("writes and renames atomically", async () => {
    const target = path.join(scratch, "atomic.txt")
    await lockWrite(target, "hello world")
    expect(readFileSync(target, "utf8")).toBe("hello world")
    // No temp file leftover
    expect(existsSync(`${target}.tmp`)).toBe(false)
  })

  it("creates intermediate directories", async () => {
    const target = path.join(scratch, "deep", "nested", "file.txt")
    await lockWrite(target, "nested")
    expect(readFileSync(target, "utf8")).toBe("nested")
  })

  it("overwrites existing content", async () => {
    const target = path.join(scratch, "over.txt")
    await lockWrite(target, "first")
    await lockWrite(target, "second")
    expect(readFileSync(target, "utf8")).toBe("second")
  })
})

describe("descriptor cache", () => {
  it("returns null on cache miss", async () => {
    const result = await readCache("git-tags", "missing", "v1.0.0")
    expect(result).toBeNull()
  })

  it("round-trips a cached descriptor", async () => {
    const entry: CachedDescriptor = {
      parsed: {
        kind: "template",
        template: {
          $schema:
            "https://registry.deessejs.com/schema/template/v2.json",
          name: "test",
          title: "Test",
          type: "template:app",
          version: "1.0.0",
          source: { repo: "test/test", ref: "v1.0.0" },
          requires: { runtime: "nextjs" },
        },
      },
      etag: null,
      refreshedAt: "2026-09-24T00:00:00Z",
      provider: "git-tags",
    }
    await writeCache("git-tags", "test", "v1.0.0", entry)
    const result = await readCache("git-tags", "test", "v1.0.0")
    expect(result?.parsed.kind).toBe("template")
    if (result?.parsed.kind === "template") {
      expect(result.parsed.template.name).toBe("test")
    }
  })

  it("purge removes the cache entry idempotently", async () => {
    const entry: CachedDescriptor = {
      parsed: {
        kind: "block",
        block: {
          $schema: "https://registry.deessejs.com/schema/block/v1.json",
          name: "x",
          title: "X",
          type: "block:feature",
          version: "1.0.0",
          source: { repo: "test/x", ref: "v1.0.0" },
          requires: { runtime: "nextjs" },
        },
      },
      etag: null,
      refreshedAt: "2026-09-24T00:00:00Z",
      provider: "git-tags",
    }
    await writeCache("git-tags", "x", "v1.0.0", entry)
    await purgeCache("git-tags", "x", "v1.0.0")
    expect(await readCache("git-tags", "x", "v1.0.0")).toBeNull()
    // Idempotent on second call
    await purgeCache("git-tags", "x", "v1.0.0")
  })
})

describe("catalogue cache", () => {
  it("round-trips a catalogue entry", async () => {
    await writeCatalogue({
      url: "https://registry.deessejs.com/registry.json",
      etag: "W/abc123",
      refreshedAt: "2026-09-24T00:00:00Z",
      items: ["saas-starter", "blog", "auth"],
    })
    const cat = await readCatalogue()
    expect(cat?.items).toEqual(["saas-starter", "blog", "auth"])
    expect(cat?.etag).toBe("W/abc123")
  })

  it("round-trip with a single-item catalogue", async () => {
    await writeCatalogue({
      url: "https://registry.deessejs.com/registry.json",
      etag: null,
      refreshedAt: "2026-09-24T00:00:00Z",
      items: ["one"],
    })
    const cat = await readCatalogue()
    expect(cat?.items).toEqual(["one"])
  })
})

describe("httpCacheKey", () => {
  it("hashes the URL into a 64-char hex string", () => {
    const k = httpCacheKey("https://registry.deessejs.com/registry.json")
    expect(k).toMatch(/^[0-9a-f]{64}$/)
  })

  it("produces distinct keys for distinct URLs", () => {
    const a = httpCacheKey("https://registry.deessejs.com/r/a.json")
    const b = httpCacheKey("https://registry.deessejs.com/r/b.json")
    expect(a).not.toBe(b)
  })

  it("produces identical keys for the same URL", () => {
    const url = "https://registry.deessejs.com/r/foo.json"
    expect(httpCacheKey(url)).toBe(httpCacheKey(url))
  })
})

describe("descriptorCachePath", () => {
  it("matches the internal item path", () => {
    const public_ = descriptorCachePath("git-tags", "blog", "v1.0.0")
    const internal_ = itemCachePath("git-tags", "blog", "v1.0.0")
    expect(public_).toBe(internal_)
  })
})

describe("_internalItemKey", () => {
  it("formats slug@ref", () => {
    expect(_internalItemKey("blog", "v1.0.0")).toBe("blog@v1.0.0")
  })
})
