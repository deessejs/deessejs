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
    // Two fetch calls: descriptor + tree
    expect(state.calls).toHaveLength(2)
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
})