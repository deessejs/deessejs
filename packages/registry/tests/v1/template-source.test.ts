import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as tar from "tar"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createGitHubTemplateSourceAdapter } from "../../src/v1/template-source.js"
import type { TemplateSourceError } from "../../src/v1/template-source.js"

const REVISION = "0123456789abcdef0123456789abcdef01234567"
const temporaryDirectories: string[] = []

async function createArchive(
  archiveName = "deessejs-fixture",
  archiveRevision = REVISION.slice(0, 7)
): Promise<Buffer> {
  const root = await mkdtemp(join(tmpdir(), "registry-source-test-"))
  temporaryDirectories.push(root)
  const source = join(root, "source")
  await mkdir(join(source, "private"), { recursive: true })
  await mkdir(join(source, "assets"), { recursive: true })
  await writeFile(join(source, "deesse-template.json"), '{"formatVersion":1}')
  await writeFile(join(source, "README.md"), "included from pinned archive\n")
  await writeFile(
    join(source, "assets", "font.woff2"),
    Buffer.from([0, 255, 16, 128])
  )
  await writeFile(join(source, "private", "secret.txt"), "filtered locally\n")
  const archivePath = join(root, "fixture.tar.gz")
  await tar.c(
    {
      cwd: source,
      file: archivePath,
      gzip: true,
      prefix: `${archiveName}-${archiveRevision}`,
    },
    ["deesse-template.json", "README.md", "assets", "private"]
  )
  return readFile(archivePath)
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  })
}

describe("createGitHubTemplateSourceAdapter", () => {
  it("pins an archive to one commit and exposes its files for local filtering", async () => {
    const archive = await createArchive()
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input)
      if (url.endsWith("/commits/v1.0.0"))
        return jsonResponse({ sha: REVISION })
      if (url.endsWith(`/tarball/${REVISION}`)) return new Response(archive)
      return new Response(null, { status: 404 })
    })
    const adapter = createGitHubTemplateSourceAdapter({
      fetch: fetchMock,
      retryCount: 0,
    })

    const snapshot = await adapter.resolve({
      repository: "DeesseJS/fixture",
      ref: "v1.0.0",
    })
    const contents = await snapshot.readFile("README.md")

    expect(snapshot.repository).toBe("deessejs/fixture")
    expect(snapshot.revision).toBe(REVISION)
    expect(snapshot.entries.map((entry) => entry.path)).toEqual(
      expect.arrayContaining([
        "deesse-template.json",
        "README.md",
        "assets/font.woff2",
        "private",
        "private/secret.txt",
      ])
    )
    expect(new TextDecoder().decode(contents)).toBe(
      "included from pinned archive\n"
    )
    expect(await snapshot.readFile("assets/font.woff2")).toEqual(
      Uint8Array.from([0, 255, 16, 128])
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      `/tarball/${REVISION}`
    )
  })

  it("accepts repository URLs whose casing differs from GitHub's archive name", async () => {
    const archive = await createArchive("deessejs-fixture")
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input)
      if (url.endsWith(`/commits/${REVISION}`))
        return jsonResponse({ sha: REVISION })
      if (url.endsWith(`/tarball/${REVISION}`)) return new Response(archive)
      return new Response(null, { status: 404 })
    })
    const adapter = createGitHubTemplateSourceAdapter({
      fetch: fetchMock,
      retryCount: 0,
    })

    const snapshot = await adapter.resolve({
      repository: "DeesseJS/FIXTURE",
      ref: REVISION,
    })

    expect(snapshot.repository).toBe("deessejs/fixture")
    expect(snapshot.revision).toBe(REVISION)
  })

  it("accepts repository URLs whose casing differs from GitHub's archive name", async () => {
    const archive = await createArchive("fixture")
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input)
      if (url.endsWith(`/commits/${REVISION}`))
        return jsonResponse({ sha: REVISION })
      if (url.endsWith(`/tarball/${REVISION}`)) return new Response(archive)
      return new Response(null, { status: 404 })
    })
    const adapter = createGitHubTemplateSourceAdapter({
      fetch: fetchMock,
      retryCount: 0,
    })

    const snapshot = await adapter.resolve({
      repository: "DeesseJS/FIXTURE",
      ref: REVISION,
    })

    expect(snapshot.repository).toBe("deessejs/fixture")
    expect(snapshot.revision).toBe(REVISION)
  })

  it("rejects an archive whose short commit SHA does not match the resolved revision", async () => {
    const archive = await createArchive("deessejs-different-repository", "ffffffff")
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input)
      if (url.endsWith("/commits/main"))
        return jsonResponse({ sha: REVISION })
      if (url.endsWith(`/tarball/${REVISION}`)) return new Response(archive)
      return new Response(null, { status: 404 })
    })
    const adapter = createGitHubTemplateSourceAdapter({
      fetch: fetchMock,
      retryCount: 0,
    })

    await expect(
      adapter.resolve({
        repository: "deessejs/different-repository",
        ref: "main",
      })
    ).rejects.toMatchObject({
      code: "source.invalid_response",
    } satisfies Partial<TemplateSourceError>)
  })

  it("fails explicitly when the archive inventory exceeds its configured limit", async () => {
    const archive = await createArchive()
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input)
      if (url.endsWith("/commits/main")) return jsonResponse({ sha: REVISION })
      return new Response(archive)
    })
    const adapter = createGitHubTemplateSourceAdapter({
      fetch: fetchMock,
      retryCount: 0,
      maxInventoryEntries: 1,
    })

    await expect(
      adapter.resolve({ repository: "deessejs/fixture", ref: "main" })
    ).rejects.toMatchObject({
      code: "source.inventory_limit_exceeded",
    } satisfies Partial<TemplateSourceError>)
  })

  it("uses the repository default branch before resolving its immutable archive", async () => {
    const archive = await createArchive()
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input)
      if (url.endsWith("/repos/deessejs/fixture")) {
        return jsonResponse({ default_branch: "main" })
      }
      if (url.endsWith("/commits/main")) return jsonResponse({ sha: REVISION })
      if (url.endsWith(`/tarball/${REVISION}`)) return new Response(archive)
      return new Response(null, { status: 404 })
    })
    const adapter = createGitHubTemplateSourceAdapter({
      fetch: fetchMock,
      retryCount: 0,
    })

    const snapshot = await adapter.resolve({ repository: "deessejs/fixture" })

    expect(snapshot.revision).toBe(REVISION)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
