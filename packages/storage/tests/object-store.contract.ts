/**
 * Shared contract tests for any ObjectStore implementation.
 *
 * Run these against every provider to guarantee that local-fs and
 * R2 agree on the contract. The test factory takes a builder
 * (`makeStore`) so each provider can wire its own setup/teardown.
 *
 * What this guards against:
 *
 *   - Behaviour drift between providers (e.g. list() semantics
 *     diverging silently between local-fs and R2).
 *   - Regressions when a provider swaps its backend (e.g. when the
 *     R2 adapter moves from the hand-rolled signer to the SDK).
 *   - Accidental changes to error semantics.
 */

import { describe, expect, it } from "vitest"

import type { ObjectStore } from "../src/object-store.js"

export interface ContractFactory {
  /** Build a fresh, empty ObjectStore. Called per test. */
  makeStore(): Promise<ObjectStore> | ObjectStore
  /** Release any resources held by the store. Optional. */
  cleanup?(store: ObjectStore): Promise<void> | void
}

export function runObjectStoreContractTests(
  label: string,
  factory: ContractFactory,
): void {
  describe(`ObjectStore contract — ${label}`, () => {
    let store: ObjectStore

    const fresh = async () => {
      store = await factory.makeStore()
      return store
    }

    it("round-trips bytes via put + get", async () => {
      await fresh()
      const body = new TextEncoder().encode("hello contract")
      await store.put("hello.txt", body)
      const out = await store.get("hello.txt")
      expect(out).not.toBeNull()
      const text = await new Response(out!).text()
      expect(text).toBe("hello contract")
    })

    it("get returns null for an absent key", async () => {
      await fresh()
      expect(await store.get("nope")).toBeNull()
    })

    it("delete removes the object and is idempotent", async () => {
      await fresh()
      await store.put("k", new Uint8Array([1]))
      await store.delete("k")
      expect(await store.get("k")).toBeNull()
      // Second delete must not throw.
      await expect(store.delete("k")).resolves.toBeUndefined()
    })

    it("head returns null for an absent key", async () => {
      await fresh()
      expect(await store.head("absent")).toBeNull()
    })

    it("head returns metadata when present", async () => {
      await fresh()
      await store.put("k.bin", new TextEncoder().encode("payload"))
      const meta = await store.head("k.bin")
      expect(meta).not.toBeNull()
      expect(meta!.key).toBe("k.bin")
      expect(meta!.size).toBe("payload".length)
    })

    it("list() with no prefix returns all keys", async () => {
      await fresh()
      await store.put("a.txt", new TextEncoder().encode("a"))
      await store.put("b.txt", new TextEncoder().encode("b"))
      const keys: string[] = []
      for await (const m of store.list()) keys.push(m.key)
      keys.sort()
      expect(keys).toEqual(["a.txt", "b.txt"])
    })

    it("list('dir') returns keys under dir/", async () => {
      await fresh()
      await store.put("a.txt", new TextEncoder().encode("a"))
      await store.put("dir/b.txt", new TextEncoder().encode("b"))
      await store.put("dir/c.txt", new TextEncoder().encode("c"))
      const keys: string[] = []
      for await (const m of store.list("dir")) keys.push(m.key)
      keys.sort()
      expect(keys).toEqual(["dir/b.txt", "dir/c.txt"])
    })

    it("list('dir/b') returns keys under dir/b/ (key-prefix semantics)", async () => {
      // Locked contract: prefix is a key-prefix filter, not a
      // directory path. This is the test that previously failed on
      // local-fs (it tried to open dir/b as a directory) and passed
      // on R2. Now both providers must agree.
      await fresh()
      await store.put("dir/a.txt", new TextEncoder().encode("a"))
      await store.put("dir/b/b1.txt", new TextEncoder().encode("b1"))
      await store.put("dir/b/b2.txt", new TextEncoder().encode("b2"))
      await store.put("dir/c.txt", new TextEncoder().encode("c"))
      const keys: string[] = []
      for await (const m of store.list("dir/b")) keys.push(m.key)
      keys.sort()
      expect(keys).toEqual(["dir/b/b1.txt", "dir/b/b2.txt"])
    })

    it("list('dir/sub') returns deeply-nested keys (3+ levels)", async () => {
      // The walker must descend into every subdirectory; the
      // filter is applied at emission time. Tests arbitrary depth.
      await fresh()
      await store.put("dir/sub/file.json", new TextEncoder().encode("d"))
      await store.put("dir/sub/deeper/file2.json", new TextEncoder().encode("e"))
      await store.put("dir/other.json", new TextEncoder().encode("o"))
      const keys: string[] = []
      for await (const m of store.list("dir/sub")) keys.push(m.key)
      keys.sort()
      expect(keys).toEqual([
        "dir/sub/deeper/file2.json",
        "dir/sub/file.json",
      ])
    })

    it("list('dir') WITHOUT a trailing slash is normalised to dir/", async () => {
      // Contract: list("dir") and list("dir/") are equivalent.
      // Without this, R2 would also match "dir2/..." keys because
      // S3 prefix matching is a strict string prefix, not a
      // path-component prefix.
      await fresh()
      await store.put("dir/a.txt", new TextEncoder().encode("a"))
      await store.put("dir/sub/b.txt", new TextEncoder().encode("b"))
      await store.put("dir2/c.txt", new TextEncoder().encode("c")) // must NOT appear
      const keys: string[] = []
      for await (const m of store.list("dir")) keys.push(m.key)
      keys.sort()
      expect(keys).toEqual(["dir/a.txt", "dir/sub/b.txt"])
    })

    it("list() under a non-existent prefix yields nothing", async () => {
      await fresh()
      const keys: string[] = []
      for await (const m of store.list("nope")) keys.push(m.key)
      expect(keys).toEqual([])
    })

    if (factory.cleanup) {
      // Run cleanup lazily at the end of the describe block via a
      // synthetic test. Vitest does not have an outer-afterAll hook
      // accessible to factory functions; this is the cheapest way.
      it("(teardown)", async () => {
        if (store && factory.cleanup) await factory.cleanup(store)
      })
    }
  })
}
