import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { c } from "tar"
import { afterEach, describe, expect, it } from "vitest"
import { inspectManagedReleaseArchive, MAX_MANAGED_ARCHIVE_BYTES } from "../../src/v1/managed-release-archive.js"

const roots: string[] = []
async function makeArchive(descriptor: unknown, preview?: Uint8Array) {
  const root = await mkdtemp(join(tmpdir(), "deesse-managed-release-"))
  roots.push(root)
  await mkdir(join(root, "assets"))
  await writeFile(join(root, "deesse-template.json"), JSON.stringify(descriptor))
  if (preview) await writeFile(join(root, "assets/preview.png"), preview)
  const chunks: Buffer[] = []
  const stream = c({ cwd: root, gzip: true, portable: true, mtime: new Date(0) }, ["deesse-template.json", ...(preview ? ["assets/preview.png"] : [])])
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return new Uint8Array(Buffer.concat(chunks))
}

const descriptor = (previewImage?: string) => ({
  $schema: "https://app.deessejs.com/schema/template/v1.json",
  formatVersion: 1,
  name: "fixture",
  title: "Fixture",
  description: "Archive inspection fixture",
  type: "template:starter",
  version: "1.2.3",
  excludes: [],
  ...(previewImage ? { previewImage } : {}),
})

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe("inspectManagedReleaseArchive", () => {
  it("accepts a valid descriptor and treats the image as optional", async () => {
    const archive = await makeArchive(descriptor())
    const info = await inspectManagedReleaseArchive({ archive, kind: "template", version: "1.2.3" })
    expect(info.descriptorDigest).toMatch(/^[a-f0-9]{64}$/)
    expect(info.preview).toBeUndefined()
  })

  it("extracts only a validated repository-relative preview image", async () => {
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    const archive = await makeArchive(descriptor("assets/preview.png"), png)
    const info = await inspectManagedReleaseArchive({ archive, kind: "template", version: "1.2.3" })
    expect(info.preview?.contentType).toBe("image/png")
    expect(info.preview?.bytes).toEqual(png)

    const invalidPng = await makeArchive(descriptor("assets/preview.png"), new Uint8Array([137, 80, 78, 71, 1, 2, 3, 4]))
    await expect(inspectManagedReleaseArchive({ archive: invalidPng, kind: "template", version: "1.2.3" })).rejects.toThrow("PNG, JPEG, or WebP")
  })

  it("rejects a descriptor version mismatch and malformed archives", async () => {
    const archive = await makeArchive(descriptor())
    await expect(inspectManagedReleaseArchive({ archive, kind: "template", version: "1.2.4" })).rejects.toThrow("version does not match")
    await expect(inspectManagedReleaseArchive({ archive: new Uint8Array([1, 2, 3]), kind: "template", version: "1.2.3" })).rejects.toThrow()
  })

  it("enforces the compressed archive cap before parsing", async () => {
    expect(MAX_MANAGED_ARCHIVE_BYTES).toBe(100 * 1024 * 1024)
    await expect(inspectManagedReleaseArchive({ archive: new Uint8Array(MAX_MANAGED_ARCHIVE_BYTES + 1), kind: "template", version: "1.2.3" })).rejects.toThrow("100 MiB")
  })
})
