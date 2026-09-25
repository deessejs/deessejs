/**
 * Tests for LocalFsObjectStore.
 *
 * Two layers:
 *
 *   1. **Contract tests** — the shared suite from
 *      `./object-store.contract.ts` runs against the local-fs
 *      provider. These guard against behavioural drift vs the R2
 *      adapter.
 *
 *   2. **local-fs-specific tests** — traversal defenses (absolute,
 *      `..`, empty keys) and atomic-write guarantees.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest"
import { mkdtempSync, rmSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { promises as fs } from "node:fs"

import { LocalFsObjectStore } from "../src/providers/local-fs.js"
import { StorageError } from "../src/errors.js"
import { runObjectStoreContractTests } from "./object-store.contract.js"

let scratch: string
let store: LocalFsObjectStore

beforeEach(() => {
  scratch = mkdtempSync(path.join(tmpdir(), "deessejs-storage-"))
  store = new LocalFsObjectStore({ root: scratch })
})

afterEach(() => {
  rmSync(scratch, { recursive: true, force: true })
})

runObjectStoreContractTests("local-fs", {
  makeStore: () => new LocalFsObjectStore({ root: scratch }),
  cleanup: () => {
    /* afterEach already removes scratch */
  },
})

/** Read a stream to completion and return the bytes. */
async function readStream(
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = []
  const reader = stream.getReader()
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  const total = chunks.reduce((s, c) => s + c.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}

/** Compare Uint8Array to expected string byte-by-byte. */
function expectBytes(actual: Uint8Array, expected: string) {
  const got = new TextDecoder().decode(actual)
  expect(got).toBe(expected)
}

describe("LocalFsObjectStore — put / get round-trip", () => {
  it("round-trips a byte-array body", async () => {
    const body = new TextEncoder().encode("hello, world")
    await store.put("hello.txt", body)
    const out = await store.get("hello.txt")
    expect(out).not.toBeNull()
    const bytes = await readStream(out!)
    expectBytes(bytes, "hello, world")
  })

  it("round-trips a stream body", async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("streamed "))
        controller.enqueue(new TextEncoder().encode("body"))
        controller.close()
      },
    })
    await store.put("stream.txt", body)
    const out = await store.get("stream.txt")
    expect(out).not.toBeNull()
    const bytes = await readStream(out!)
    expectBytes(bytes, "streamed body")
  })

  it("creates intermediate directories on put", async () => {
    await store.put("nested/dir/file.json", new TextEncoder().encode("v"))
    const exists = existsSync(path.join(scratch, "nested", "dir", "file.json"))
    expect(exists).toBe(true)
  })

  it("replaces existing content on a second put to the same key", async () => {
    await store.put("k", new TextEncoder().encode("v1"))
    await store.put("k", new TextEncoder().encode("v2"))
    const bytes = await readStream((await store.get("k"))!)
    expectBytes(bytes, "v2")
  })
})

describe("LocalFsObjectStore — list prefix filtering (key-prefix contract)", () => {
  // The contract tests cover the happy paths. Here we cover the
  // edge cases specific to local-fs.

  it("list('a/b/c') returns deeply-nested descendants", async () => {
    await store.put("a/b/c/d.txt", new TextEncoder().encode("d"))
    await store.put("a/b/c/e.txt", new TextEncoder().encode("e"))
    await store.put("a/b/x.txt", new TextEncoder().encode("x"))
    const keys: string[] = []
    for await (const m of store.list("a/b/c")) keys.push(m.key)
    keys.sort()
    expect(keys).toEqual(["a/b/c/d.txt", "a/b/c/e.txt"])
  })

  it("list('trailing/') with a trailing slash is normalised identically", async () => {
    await store.put("trailing/x.txt", new TextEncoder().encode("x"))
    const keys: string[] = []
    for await (const m of store.list("trailing/")) keys.push(m.key)
    keys.sort()
    expect(keys).toEqual(["trailing/x.txt"])
  })
})

describe("LocalFsObjectStore — key-traversal defenses", () => {
  it("rejects an absolute key", async () => {
    await expect(store.put("/etc/passwd", new Uint8Array())).rejects.toThrow(
      /absolute/,
    )
  })

  it("rejects a '..' segment in the key", async () => {
    await expect(
      store.put("../escape.txt", new Uint8Array()),
    ).rejects.toThrow(/escapes the configured root/)
  })

  it("rejects an empty key", async () => {
    await expect(store.put("", new Uint8Array())).rejects.toThrow(
      StorageError,
    )
  })

  it("does not let a '..' segment touch the parent of root", async () => {
    // Belt-and-braces. Even if the prefix-resolution check were
    // bypassed, the rename() target would still be outside the root
    // and fail.
    const parentDir = path.dirname(scratch)
    const watchFile = path.join(parentDir, "leaked.txt")
    try {
      await store.put("../leaked.txt", new TextEncoder().encode("hax"))
      if (existsSync(watchFile)) {
        throw new Error("PUT escaped the configured root: " + watchFile)
      }
    } catch {
      // Expected: the key validation throws.
    } finally {
      rmSync(watchFile, { force: true })
    }
  })
})

describe("LocalFsObjectStore — atomic write contract", () => {
  it("does not leave a torn file at the target when put fails", async () => {
    const blocker = path.join(scratch, "blocker")
    await fs.mkdir(blocker)

    await expect(
      store.put("blocker", new Uint8Array([1, 2, 3])),
    ).rejects.toThrow()

    expect(existsSync(path.join(scratch, "blocker"))).toBe(true)
  })

  it("does not leave a stale .tmp file after a write failure", async () => {
    const blocker = path.join(scratch, "blocker")
    await fs.mkdir(blocker)

    await expect(
      store.put("blocker", new Uint8Array([1, 2, 3])),
    ).rejects.toThrow()

    const walk = async (dir: string): Promise<string[]> => {
      const out: string[] = []
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const ent of entries) {
        const p = path.join(dir, ent.name)
        if (ent.isDirectory()) {
          out.push(...(await walk(p)))
        } else {
          out.push(p)
        }
      }
      return out
    }
    const all = await walk(scratch)
    const leftover = all.filter((p) => p.includes(".tmp."))
    expect(leftover).toEqual([])
  })
})
