import { createHash } from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"
import { MAX_MANAGED_ARCHIVE_BYTES } from "@workspace/registry/v1"
import { downloadManagedArchive } from "../../src/utils/download-managed-archive.js"

afterEach(() => vi.unstubAllGlobals())

describe("downloadManagedArchive", () => {
  it("rejects an oversized Content-Length before reading the body", async () => {
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.close() } })
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, headers: new Headers({ "content-length": String(MAX_MANAGED_ARCHIVE_BYTES + 1) }), body }) as Response))
    await expect(downloadManagedArchive("https://private.invalid/a", "a".repeat(64))).rejects.toThrow("100 MiB")
  })

  it("enforces the cap while streaming even when the header is absent", async () => {
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue({ byteLength: MAX_MANAGED_ARCHIVE_BYTES + 1 } as Uint8Array); controller.close() } })
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, headers: new Headers(), body }) as Response))
    await expect(downloadManagedArchive("https://private.invalid/a", "a".repeat(64))).rejects.toThrow("100 MiB")
  })

  it("propagates an interrupted response stream", async () => {
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.error(new Error("connection interrupted")) } })
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, headers: new Headers(), body }) as Response))
    await expect(downloadManagedArchive("https://private.invalid/a", "a".repeat(64))).rejects.toThrow("connection interrupted")
  })

  it("verifies the exact archive checksum before returning bytes", async () => {
    const bytes = new Uint8Array([1, 2, 3])
    vi.stubGlobal("fetch", vi.fn(async () => new Response(bytes)))
    const expected = createHash("sha256").update(bytes).digest("hex")
    await expect(downloadManagedArchive("https://private.invalid/a", expected)).resolves.toEqual(bytes)
    await expect(downloadManagedArchive("https://private.invalid/a", "f".repeat(64))).rejects.toThrow("digest did not match")
  })
})
