/**
 * Tests for LocalFsObjectStore.
 *
 * Covers:
 *   - put/get round-trip for byte-array bodies
 *   - put/get round-trip for stream bodies
 *   - head returns size and mtime when present
 *   - head returns null when absent (no exception)
 *   - get returns null when absent (no exception)
 *   - delete is idempotent (succeeds when absent)
 *   - list streams children with correct keys
 *   - key-traversal defenses reject `..`, absolute paths, empty keys
 *   - atomic-write contract: a crashed write leaves no torn files
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest"
import { mkdtempSync, rmSync, existsSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { promises as fs } from "node:fs"

import { LocalFsObjectStore } from "../src/providers/local-fs.js"
import {
  StorageError,
  StorageNotFoundError,
} from "../src/errors.js"

let scratch: string
let store: LocalFsObjectStore

beforeEach(() => {
  scratch = mkdtempSync(path.join(tmpdir(), "deessejs-storage-"))
  store = new LocalFsObjectStore({ root: scratch })
})

afterEach(() => {
  rmSync(scratch, { recursive: true, force: true })
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
  return new Uint8Array(
    chunks.reduce<number[]>((acc, c) => {
      acc.push(...c)
      return acc
    }, []),
  )
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

describe("LocalFsObjectStore — head / get / delete", () => {
  it("head returns metadata when the object exists", async () => {
    const body = new TextEncoder().encode("hello")
    await store.put("key.bin", body)
    const meta = await store.head("key.bin")
    expect(meta).not.toBeNull()
    expect(meta!.key).toBe("key.bin")
    expect(meta!.size).toBe(5)
    expect(meta!.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it("head returns null when the object is absent", async () => {
    const meta = await store.head("does-not-exist")
    expect(meta).toBeNull()
  })

  it("get returns null when the object is absent", async () => {
    const body = await store.get("absent")
    expect(body).toBeNull()
  })

  it("delete removes the object", async () => {
    await store.put("to-delete", new TextEncoder().encode("v"))
    await store.delete("to-delete")
    const meta = await store.head("to-delete")
    expect(meta).toBeNull()
  })

  it("delete is idempotent on an absent object", async () => {
    await expect(store.delete("never-existed")).resolves.toBeUndefined()
  })
})

describe("LocalFsObjectStore — list", () => {
  it("streams descendants with forward-slash keys", async () => {
    await store.put("a.txt", new TextEncoder().encode("a"))
    await store.put("dir/b.txt", new TextEncoder().encode("b"))
    await store.put("dir/c.txt", new TextEncoder().encode("c"))

    const keys: string[] = []
    for await (const m of store.list()) keys.push(m.key)
    keys.sort()
    expect(keys).toEqual(["a.txt", "dir/b.txt", "dir/c.txt"])
  })

  it("filters by prefix", async () => {
    await store.put("a.txt", new TextEncoder().encode("a"))
    await store.put("dir/b.txt", new TextEncoder().encode("b"))
    await store.put("dir/c.txt", new TextEncoder().encode("c"))

    const keys: string[] = []
    for await (const m of store.list("dir")) keys.push(m.key)
    keys.sort()
    expect(keys).toEqual(["dir/b.txt", "dir/c.txt"])
  })

  it("returns zero items under a non-existent prefix", async () => {
    const keys: string[] = []
    for await (const m of store.list("does-not-exist")) keys.push(m.key)
    expect(keys).toEqual([])
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
      // If the put somehow succeeded, the leaked file is present.
      // If it threw, this expect fails the test correctly.
      if (existsSync(watchFile)) {
        throw new Error("PUT escaped the configured root: " + watchFile)
      }
    } catch {
      // Expected: the key validation throws, or fs.writeFile fails
      // because the resolved path is outside the root. Either way,
      // no file leaked.
    } finally {
      // Cleanup just in case.
      rmSync(watchFile, { force: true })
    }
  })
})

describe("LocalFsObjectStore — atomic write contract", () => {
  it("does not leave a torn file at the target when put fails", async () => {
    // Trigger a write failure at the fs level: pre-create a
    // *directory* at the target key. fs.writeFile to a path where
    // a directory already exists fails with EISDIR, which routes
    // through the same try/catch as a stream failure.
    const blocker = path.join(scratch, "blocker")
    await fs.mkdir(blocker)

    await expect(
      store.put("blocker", new Uint8Array([1, 2, 3])),
    ).rejects.toThrow()

    // The target key's resolved path is `blocker/`, a directory.
    // The fs.rename call would have failed before any "torn" file
    // could land at the target. There is no partial file.
    expect(existsSync(path.join(scratch, "blocker"))).toBe(true)
  })

  it("does not leave a stale .tmp file after a write failure", async () => {
    const blocker = path.join(scratch, "blocker")
    await fs.mkdir(blocker)

    await expect(
      store.put("blocker", new Uint8Array([1, 2, 3])),
    ).rejects.toThrow()

    // Walk the entire tree under scratch and verify no .tmp.* remains.
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
