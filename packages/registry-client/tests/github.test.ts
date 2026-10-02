/**
 * Tests for `packages/registry-client/src/github.ts`.
 *
 * Direct-GitHub fetch path. Mocks `fetch` the same way
 * `mock-client.test.ts` does — captures every (url, method, body)
 * triple and dispatches a `Response` per case.
 *
 * Coverage:
 *   - 200 + valid descriptor → Ok with descriptor + files URLs
 *   - 404 → RegistryIncompatibleTemplate(missing_descriptor)
 *   - 401 → RegistryAuthRequired
 *   - 5xx → RegistryFetchFailed
 *   - fetch throws → RegistryNetworkError
 *   - 200 + malformed JSON → RegistryIncompatibleTemplate(invalid_descriptor)
 *   - 200 + descriptor fails Zod → RegistryInvalidDescriptor
 *   - ref default is "main"; custom ref is passed through
 *   - file URLs use the resolved ref (not the default)
 *   - getInfoFromGithub derives TemplateInfo from the descriptor
 */
import { describe, expect, it } from "vitest"

import {
  getInfoFromGithub,
  getRepoExists,
  getTemplateFromGithub,
  resolveTemplateFromGithub,
} from "../src/github.js"

const VALID_TEMPLATE = {
  $schema:
    "https://registry.deessejs.com/schema/template/v2.json" as const,
  name: "valid-template",
  title: "A Valid Template",
  type: "template:app" as const,
  version: "1.0.0",
  description: "A test template used by the SDK contract suite.",
  source: {
    repo: "deessejs/templates",
    ref: "v1.0.0",
  },
  files: [
    { path: "package.json", type: "template:config" as const },
    { path: "src/index.ts", type: "template:source" as const },
  ],
} as const

interface CapturedRequest {
  url: string
  method: string
}

const makeMockFetch = (
  responder: (req: CapturedRequest) => Response | Promise<Response>,
): {
  readonly fetchImpl: typeof fetch
  readonly state: { calls: CapturedRequest[] }
} => {
  const state: { calls: CapturedRequest[] } = { calls: [] }
  const fetchImpl: typeof fetch = async (
    url: string | URL | Request,
    init?: RequestInit,
  ) => {
    const urlString = typeof url === "string" ? url : url.toString()
    const captured: CapturedRequest = {
      url: urlString,
      method: init?.method ?? "GET",
    }
    state.calls.push(captured)
    return responder(captured)
  }
  return { fetchImpl, state }
}

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })

// ---------------------------------------------------------------------------
// getTemplateFromGithub
// ---------------------------------------------------------------------------

describe("getTemplateFromGithub", () => {
  it("returns Ok for a valid descriptor", async () => {
    const { fetchImpl, state } = makeMockFetch(() =>
      jsonResponse(200, VALID_TEMPLATE),
    )
    const result = await getTemplateFromGithub(
      "deessejs",
      "saas-template",
      undefined,
      fetchImpl,
    )
    expect(result._tag).toBe("Ok")
    if (result._tag === "Ok") {
      expect(result.value.descriptor.name).toBe("valid-template")
      expect(Object.keys(result.value.files).sort()).toEqual([
        "package.json",
        "src/index.ts",
      ])
      // Default ref is "main"
      expect(result.value.files["package.json"]).toBe(
        "https://raw.githubusercontent.com/deessejs/saas-template/main/package.json",
      )
    }
    // Captured exactly one fetch to raw.githubusercontent.com
    expect(state.calls).toHaveLength(1)
    expect(state.calls[0]?.url).toBe(
      "https://raw.githubusercontent.com/deessejs/saas-template/main/deesse-template.json",
    )
  })

  it("passes through the explicit ref", async () => {
    const { fetchImpl, state } = makeMockFetch(() =>
      jsonResponse(200, VALID_TEMPLATE),
    )
    const result = await getTemplateFromGithub(
      "deessejs",
      "saas-template",
      "v1.4.0",
      fetchImpl,
    )
    expect(result._tag).toBe("Ok")
    if (result._tag === "Ok") {
      expect(result.value.files["package.json"]).toBe(
        "https://raw.githubusercontent.com/deessejs/saas-template/v1.4.0/package.json",
      )
    }
    expect(state.calls[0]?.url).toContain("/v1.4.0/deesse-template.json")
  })

  it("returns RegistryIncompatibleTemplate(404, missing_descriptor)", async () => {
    const { fetchImpl } = makeMockFetch(() =>
      jsonResponse(404, { error: "not found" }),
    )
    const result = await getTemplateFromGithub(
      "deessejs",
      "no-descriptor",
      undefined,
      fetchImpl,
    )
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryIncompatibleTemplate")
      if (result.error._tag === "RegistryIncompatibleTemplate") {
        expect(result.error.cause).toBe("missing_descriptor")
        expect(result.error.repo).toBe("deessejs/no-descriptor")
      }
    }
  })

  it("returns RegistryAuthRequired on 401", async () => {
    const { fetchImpl } = makeMockFetch(() =>
      jsonResponse(401, { error: "auth required" }),
    )
    const result = await getTemplateFromGithub(
      "deessejs",
      "private",
      undefined,
      fetchImpl,
    )
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryAuthRequired")
    }
  })

  it("returns RegistryFetchFailed on 5xx", async () => {
    const { fetchImpl } = makeMockFetch(() =>
      jsonResponse(502, { error: "upstream" }),
    )
    const result = await getTemplateFromGithub(
      "deessejs",
      "saas-template",
      undefined,
      fetchImpl,
    )
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryFetchFailed")
    }
  })

  it("returns RegistryNetworkError on transport failure", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new TypeError("fetch failed: ECONNRESET")
    }
    const result = await getTemplateFromGithub(
      "deessejs",
      "saas-template",
      undefined,
      fetchImpl,
    )
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryNetworkError")
    }
  })

  it("returns RegistryIncompatibleTemplate on malformed JSON", async () => {
    const { fetchImpl } = makeMockFetch(
      () => new Response("not json", { status: 200 }),
    )
    const result = await getTemplateFromGithub(
      "deessejs",
      "bad-template",
      undefined,
      fetchImpl,
    )
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryIncompatibleTemplate")
      if (result.error._tag === "RegistryIncompatibleTemplate") {
        expect(result.error.cause).toBe("invalid_descriptor")
      }
    }
  })

  it("returns RegistryInvalidDescriptor on Zod failure", async () => {
    const { fetchImpl } = makeMockFetch(() =>
      jsonResponse(200, { $schema: "wrong", name: 123 }),
    )
    const result = await getTemplateFromGithub(
      "deessejs",
      "bad-template",
      undefined,
      fetchImpl,
    )
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryInvalidDescriptor")
    }
  })

  it("returns an empty map when descriptor declares no files and no globs (V1 empty case)", async () => {
    const empty = {
      $schema:
        "https://registry.deessejs.com/schema/template/v2.json" as const,
      name: "empty-template",
      title: "Empty Template",
      type: "template:app" as const,
      version: "1.0.0",
      source: { repo: "deessejs/empty-template", ref: "main" },
      files: [],
    }
    const { fetchImpl, state } = makeMockFetch(() => jsonResponse(200, empty))
    const result = await getTemplateFromGithub(
      "deessejs",
      "empty-template",
      undefined,
      fetchImpl,
    )
    expect(result._tag).toBe("Ok")
    if (result._tag === "Ok") {
      expect(result.value.files).toEqual({})
    }
    // Only one fetch (descriptor). No tree fetch on the empty path.
    expect(state.calls).toHaveLength(1)
  })

  it("fetches the tree and synthesises URLs when descriptor is glob-only (V2 path)", async () => {
    const globOnly = {
      $schema:
        "https://registry.deessejs.com/schema/template/v2.json" as const,
      name: "package-template",
      title: "Package Template",
      type: "template:starter" as const,
      version: "1.0.0",
      source: { repo: "deessejs/package-template", ref: "main" },
      includes: ["**"],
      excludes: [".claude/**"],
      fileTypes: { "scripts/setup.mjs": "source" },
    }
    const TREE = {
      sha: "abc",
      tree: [
        { path: "package.json", type: "blob" },
        { path: "scripts/setup.mjs", type: "blob" },
        { path: ".claude/MEMORY.md", type: "blob" },
      ],
      truncated: false,
    }
    const { fetchImpl, state } = makeMockFetch((req) => {
      if (req.url.includes("/git/trees/")) return treeResponse(200, TREE)
      return jsonResponse(200, globOnly)
    })
    const result = await getTemplateFromGithub(
      "deessejs",
      "package-template",
      undefined,
      fetchImpl,
    )
    expect(result._tag).toBe("Ok")
    if (result._tag === "Ok") {
      // Two files survive excludes: package.json + scripts/setup.mjs.
      // .claude/MEMORY.md is excluded.
      expect(Object.keys(result.value.files).sort()).toEqual([
        "package.json",
        "scripts/setup.mjs",
      ])
      expect(result.value.files["package.json"]).toContain("package.json")
      expect(result.value.files["scripts/setup.mjs"]).toContain("setup.mjs")
    }
    // Two fetches: descriptor + tree (no repo-existence probe here — only resolveTemplate adds that).
    expect(state.calls).toHaveLength(2)
  })

  it("preserves the V1 fast-path when descriptor.files[] is non-empty (no tree fetch)", async () => {
    // Even when the descriptor also declares includes, an explicit
    // files[] entry wins via the resolver's dedup. But more
    // importantly, no tree fetch happens because descriptor.files[]
    // is the fast-path.
    const mixed = {
      ...VALID_TEMPLATE, // includes package.json + src/index.ts in files
      includes: ["**"],
      excludes: ["**/*.test.ts"],
    }
    const { fetchImpl, state } = makeMockFetch(() => jsonResponse(200, mixed))
    const result = await getTemplateFromGithub(
      "deessejs",
      "saas-template",
      undefined,
      fetchImpl,
    )
    expect(result._tag).toBe("Ok")
    if (result._tag === "Ok") {
      expect(Object.keys(result.value.files).sort()).toEqual([
        "package.json",
        "src/index.ts",
      ])
    }
    expect(state.calls).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// getInfoFromGithub
// ---------------------------------------------------------------------------

describe("getInfoFromGithub", () => {
  it("returns Ok with derived TemplateInfo for a valid descriptor", async () => {
    const { fetchImpl } = makeMockFetch(() =>
      jsonResponse(200, VALID_TEMPLATE),
    )
    const result = await getInfoFromGithub(
      "deessejs",
      "saas-template",
      fetchImpl,
    )
    expect(result._tag).toBe("Ok")
    if (result._tag === "Ok") {
      expect(result.value.slug).toBe("deessejs/saas-template")
      expect(result.value.title).toBe("A Valid Template")
      expect(result.value.layer).toBe("open-community")
      expect(result.value.latestVersion).toBe("1.0.0")
      expect(result.value.versions).toEqual(["1.0.0"])
    }
  })

  it("returns RegistryIncompatibleTemplate on 404", async () => {
    const { fetchImpl } = makeMockFetch(() =>
      jsonResponse(404, { error: "not found" }),
    )
    const result = await getInfoFromGithub(
      "deessejs",
      "no-descriptor",
      fetchImpl,
    )
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryIncompatibleTemplate")
    }
  })

  it("returns RegistryIncompatibleTemplate when JSON parse fails", async () => {
    const { fetchImpl } = makeMockFetch(
      () => new Response("not json", { status: 200 }),
    )
    const result = await getInfoFromGithub(
      "deessejs",
      "bad-template",
      fetchImpl,
    )
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryIncompatibleTemplate")
      if (result.error._tag === "RegistryIncompatibleTemplate") {
        expect(result.error.cause).toBe("invalid_descriptor")
      }
    }
  })
})

// ---------------------------------------------------------------------------
// resolveTemplateFromGithub
// ---------------------------------------------------------------------------

const TREE_BODY = {
  sha: "abc123",
  tree: [
    { path: "package.json", type: "blob" },
    { path: "src/index.ts", type: "blob" },
    { path: "src/foo.test.ts", type: "blob" },
    { path: "docs", type: "tree" }, // ignored: not a blob
  ],
  truncated: false,
}

const treeResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })

describe("resolveTemplateFromGithub", () => {
  it("returns Ok with descriptor + resolved files when both descriptor and tree succeed", async () => {
    const { fetchImpl, state } = makeMockFetch((req) => {
      if (req.url.includes("/git/trees/")) return treeResponse(200, TREE_BODY)
      return jsonResponse(200, VALID_TEMPLATE)
    })
    const result = await resolveTemplateFromGithub(
      "deessejs",
      "saas-template",
      undefined,
      fetchImpl,
    )
    expect(result._tag).toBe("Ok")
    if (result._tag === "Ok") {
      expect(result.value.descriptor.name).toBe("valid-template")
      expect(result.value.treeRef).toBe("main")
      expect(result.value.source).toBe("github-tree")
      // Files: package.json + src/index.ts (VALID_TEMPLATE.files) + src/foo.test.ts (tree)
      // src/foo.test.ts is excluded because VALID_TEMPLATE.files only declares package.json + src/index.ts
      // but the resolver uses includes/excludes from VALID_TEMPLATE.files... wait, no — resolver uses descriptor.includes/excludes
      // VALID_TEMPLATE has neither, so default includes=["**"] applies, all blobs survive.
      const paths = result.value.files.map((f) => f.path).sort()
      expect(paths).toContain("package.json")
      expect(paths).toContain("src/index.ts")
      expect(paths).toContain("src/foo.test.ts")
    }
    // Three fetch calls: repo-existence probe + descriptor + tree
    expect(state.calls).toHaveLength(3)
  })

  it("returns RegistryTreeFailed when tree fetch returns 5xx", async () => {
    const { fetchImpl } = makeMockFetch((req) => {
      if (req.url.includes("/git/trees/")) return treeResponse(502, { error: "bad gateway" })
      return jsonResponse(200, VALID_TEMPLATE)
    })
    const result = await resolveTemplateFromGithub(
      "deessejs",
      "saas-template",
      undefined,
      fetchImpl,
    )
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryTreeFailed")
    }
  })

  it("returns RegistryTreeFailed when tree is truncated", async () => {
    const { fetchImpl } = makeMockFetch((req) => {
      if (req.url.includes("/git/trees/")) {
        return treeResponse(200, { ...TREE_BODY, truncated: true })
      }
      return jsonResponse(200, VALID_TEMPLATE)
    })
    const result = await resolveTemplateFromGithub(
      "deessejs",
      "huge-template",
      undefined,
      fetchImpl,
    )
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryTreeFailed")
    }
  })

  it("returns RegistryNotFound when the repo does not exist on GitHub", async () => {
    // Without this check, the raw.githubusercontent.com fetch would
    // also 404 and we'd mis-report as RegistryIncompatibleTemplate
    // (missing_descriptor), which is misleading.
    const { fetchImpl, state } = makeMockFetch((req) => {
      if (req.url.endsWith("/repos/deessejs/template")) {
        return new Response(JSON.stringify({ message: "Not Found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        })
      }
      // The descriptor + tree endpoints must NOT be called.
      throw new Error(`unexpected fetch to ${req.url}`)
    })
    const result = await resolveTemplateFromGithub(
      "deessejs",
      "template",
      undefined,
      fetchImpl,
    )
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryNotFound")
    }
    // Only one fetch: the repo existence probe.
    expect(state.calls).toHaveLength(1)
  })
})

describe("getRepoExists", () => {
  it("returns Ok(true) when the repo exists (200)", async () => {
    const { fetchImpl } = makeMockFetch(() =>
      new Response(JSON.stringify({ full_name: "deessejs/package-template" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    )
    const result = await getRepoExists("deessejs", "package-template", fetchImpl)
    expect(result._tag).toBe("Ok")
    if (result._tag === "Ok") expect(result.value).toBe(true)
  })

  it("returns RegistryNotFound when the repo is absent (404)", async () => {
    const { fetchImpl } = makeMockFetch(() =>
      new Response(JSON.stringify({ message: "Not Found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    )
    const result = await getRepoExists("deessejs", "nope", fetchImpl)
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryNotFound")
    }
  })

  it("returns RegistryFetchFailed on 5xx", async () => {
    const { fetchImpl } = makeMockFetch(() =>
      new Response("server error", { status: 502 }),
    )
    const result = await getRepoExists("deessejs", "package-template", fetchImpl)
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryFetchFailed")
    }
  })
})