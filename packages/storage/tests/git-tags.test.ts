import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import {
  GitTagsProvider,
  gitTagsProvider,
} from "../src/providers/git-tags.js"
import {
  StorageInvalidDescriptorError,
  StorageNetworkError,
  StorageNotFoundError,
  StorageOfflineViolationError,
} from "../src/errors.js"

import {
  buildBlockTarball,
  buildEmptyTarball,
  buildTemplateTarball,
  minimalBlockV1,
  minimalTemplateV2,
} from "./git-tags-fixtures.js"

let originalHome: string | undefined
let originalXdg: string | undefined
let scratchHome: string

beforeEach(() => {
  // Redirect both homedir-derived paths via env vars so the cache
  // does not write to the user's real ~/.deessejs.
  scratchHome = mkdtempSync(path.join(tmpdir(), "deessejs-home-"))
  originalHome = process.env.HOME
  originalXdg = process.env.XDG_CACHE_HOME
  process.env.HOME = scratchHome
  process.env.XDG_CACHE_HOME = path.join(scratchHome, ".cache")
  delete process.env.CI
  delete process.env.DEESSE_OFFLINE
})

afterEach(() => {
  if (originalHome === undefined) delete process.env.HOME
  else process.env.HOME = originalHome
  if (originalXdg === undefined) delete process.env.XDG_CACHE_HOME
  else process.env.XDG_CACHE_HOME = originalXdg
  rmSync(scratchHome, { recursive: true, force: true })
})

/**
 * Wrap a tarball stream in a tarball fetch response. Returns a
 * pre-built Response-shaped object suitable for the fetchImpl seam.
 */
function tarballResponse(
  body: ReadableStream<Uint8Array>,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  return new Response(body, {
    status: init.status ?? 200,
    headers: init.headers,
  })
}

function emptyResponse(status: number): Response {
  return new Response("", { status })
}

describe("GitTagsProvider — happy path", () => {
  it("acquires a template-shaped descriptor from a tarball", async () => {
    const tpl = minimalTemplateV2({ name: "saas-starter" })
    const tarball = await buildTemplateTarball(tpl)

    const fetchImpl: typeof fetch = async (url) => {
      // Verify the request URL — must be the tag URL, not branch or SHA.
      expect(url).toBe(
        "https://codeload.github.com/deessejs/saas-starter/tar.gz/refs/tags/v1.0.0",
      )
      return tarballResponse(tarball)
    }

    const provider = new GitTagsProvider("deessejs/saas-starter", fetchImpl)
    const result = await provider.acquire("saas-starter", "v1.0.0")

    expect(result.kind).toBe("template")
    if (result.kind === "template") {
      expect(result.template.name).toBe("saas-starter")
      expect(result.template.requires.runtime).toBe("nextjs")
    }
  })

  it("acquires a block-shaped descriptor when filename is deessejs-block.json", async () => {
    const blk = minimalBlockV1({ name: "blog" })
    const tarball = await buildBlockTarball(blk)

    const fetchImpl: typeof fetch = async () => tarballResponse(tarball)

    const provider = new GitTagsProvider("deessejs/blog", fetchImpl)
    const result = await provider.acquire("blog", "v1.0.0")

    expect(result.kind).toBe("block")
    if (result.kind === "block") {
      expect(result.block.name).toBe("blog")
    }
  })

  it("uses the tag URL for tag refs", async () => {
    const tpl = minimalTemplateV2()
    const tarball = await buildTemplateTarball(tpl)

    let observedUrl: string | null = null
    const fetchImpl: typeof fetch = async (url) => {
      observedUrl = url
      return tarballResponse(tarball)
    }
    const provider = new GitTagsProvider("deessejs/saas-template", fetchImpl)
    await provider.acquire("saas-template", "v1.4.0")

    expect(observedUrl).toBe(
      "https://codeload.github.com/deessejs/saas-template/tar.gz/refs/tags/v1.4.0",
    )
  })

  it("uses refs/heads URL for branch refs", async () => {
    const tpl = minimalTemplateV2()
    const tarball = await buildTemplateTarball(tpl)

    let observedUrl: string | null = null
    const fetchImpl: typeof fetch = async (url) => {
      observedUrl = url
      return tarballResponse(tarball)
    }
    const provider = new GitTagsProvider("deessejs/saas-template", fetchImpl)
    await provider.acquire("saas-template", "main")

    expect(observedUrl).toBe(
      "https://codeload.github.com/deessejs/saas-template/tar.gz/refs/heads/main",
    )
  })

  it("falls back to SHA-pinned URL for SHA refs", async () => {
    const tpl = minimalTemplateV2()
    const tarball = await buildTemplateTarball(tpl)

    let observedUrl: string | null = null
    const fetchImpl: typeof fetch = async (url) => {
      observedUrl = url
      return tarballResponse(tarball)
    }
    const provider = new GitTagsProvider("deessejs/saas-template", fetchImpl)
    await provider.acquire("saas-template", "a1b2c3d4")

    expect(observedUrl).toBe(
      "https://codeload.github.com/deessejs/saas-template/tar.gz/a1b2c3d4",
    )
  })
})

describe("GitTagsProvider — error paths", () => {
  it("throws StorageNotFoundError on HTTP 404", async () => {
    const fetchImpl: typeof fetch = async () => emptyResponse(404)
    const provider = new GitTagsProvider("deessejs/missing", fetchImpl)
    await expect(provider.acquire("missing", "v1.0.0")).rejects.toBeInstanceOf(
      StorageNotFoundError,
    )
  })

  it("throws StorageNetworkError on HTTP 500", async () => {
    const fetchImpl: typeof fetch = async () => emptyResponse(500)
    const provider = new GitTagsProvider("deessejs/x", fetchImpl)
    await expect(provider.acquire("x", "v1.0.0")).rejects.toBeInstanceOf(
      StorageNetworkError,
    )
  })

  it("throws StorageNetworkError when fetch throws (network failure)", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new TypeError("fetch failed: ECONNREFUSED")
    }
    const provider = new GitTagsProvider("deessejs/x", fetchImpl)
    await expect(provider.acquire("x", "v1.0.0")).rejects.toBeInstanceOf(
      StorageNetworkError,
    )
  })

  it("throws StorageInvalidDescriptorError when the archive has no root descriptor", async () => {
    const tarball = await buildEmptyTarball()
    const fetchImpl: typeof fetch = async () => tarballResponse(tarball)
    const provider = new GitTagsProvider("deessejs/empty", fetchImpl)
    await expect(provider.acquire("empty", "v1.0.0")).rejects.toBeInstanceOf(
      StorageInvalidDescriptorError,
    )
  })

  it("throws StorageInvalidDescriptorError when the descriptor fails schema validation", async () => {
    // Schema-incompatible payload: missing required $schema field.
    const tarball = await buildTemplateTarball({
      name: "broken",
      title: "Broken",
      type: "template:app",
      version: "1.0.0",
    })
    const fetchImpl: typeof fetch = async () => tarballResponse(tarball)
    const provider = new GitTagsProvider("deessejs/broken", fetchImpl)
    await expect(provider.acquire("broken", "v1.0.0")).rejects.toBeInstanceOf(
      StorageInvalidDescriptorError,
    )
  })
})

describe("GitTagsProvider — offline invariant", () => {
  it("throws StorageOfflineViolationError in CI when cache misses", async () => {
    process.env.CI = "true"
    const fetchImpl: typeof fetch = async () => {
      throw new Error("fetchImpl should never be called in offline mode")
    }
    const provider = new GitTagsProvider("deessejs/x", fetchImpl)
    await expect(provider.acquire("x", "v1.0.0")).rejects.toBeInstanceOf(
      StorageOfflineViolationError,
    )
  })

  it("returns the cached descriptor in CI without network access", async () => {
    // First, seed the cache by performing a normal (non-CI) acquire.
    const tpl = minimalTemplateV2({ name: "cached-template" })
    const tarball = await buildTemplateTarball(tpl)
    const tarballFetch: typeof fetch = async () =>
      tarballResponse(tarball)
    const provider = new GitTagsProvider("deessejs/cached", tarballFetch)
    await provider.acquire("cached-template", "v1.0.0")

    // Now flip to CI mode. The cache hit should satisfy without
    // any network call.
    process.env.CI = "true"
    const offlineFetch: typeof fetch = async () => {
      throw new Error("offline fetchImpl should never be called here")
    }
    const offlineProvider = new GitTagsProvider(
      "deessejs/cached",
      offlineFetch,
    )
    const result = await offlineProvider.acquire(
      "cached-template",
      "v1.0.0",
    )
    expect(result.kind).toBe("template")
    if (result.kind === "template") {
      expect(result.template.name).toBe("cached-template")
    }
  })
})

describe("GitTagsProvider — publish is read-only", () => {
  it("throws StorageNotFoundError when publish is called (V1 is read-only by design)", async () => {
    const fetchImpl: typeof fetch = async () => emptyResponse(200)
    const provider = new GitTagsProvider("deessejs/x", fetchImpl)
    await expect(
      provider.publish("x", "v1.0.0", {
        kind: "template",
        template: minimalTemplateV2() as never,
      }),
    ).rejects.toBeInstanceOf(StorageNotFoundError)
  })
})

describe("gitTagsProvider factory", () => {
  it("returns a GitTagsProvider scoped to the given ownerRepo", async () => {
    const provider = gitTagsProvider("deessejs/saas-template")
    expect(provider.ownerRepo).toBe("deessejs/saas-template")
    expect(provider.providerId).toBe("git-tags")
  })
})
