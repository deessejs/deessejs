/**
 * Tests for the registry SDK via a mock fetch.
 *
 * These tests exercise the public SDK API end-to-end by injecting a
 * fake `fetch` that responds to URL+method+path combinations.
 *
 * Together with `object-store.contract.ts` (the shared contract
 * suite), this file proves the SDK works against a realistic
 * server response shape.
 */

import { describe, expect, it } from "vitest"

import { createClient } from "../src/registry.js"
import { runRegistryContractTests } from "./object-store.contract.js"

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

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

const VALID_CATALOG = [
  {
    slug: "valid-slug",
    title: "Valid Slug",
    description: "A test catalog entry.",
    layer: "open-community" as const,
    latestVersion: "1.0.0",
  },
  {
    slug: "gated-slug",
    title: "Gated Slug",
    layer: "pro" as const,
    latestVersion: "1.0.0",
  },
] as const

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

interface CapturedRequest {
  url: string
  method: string
  body: unknown
}

const makeMockFetch = (
  responder: (req: CapturedRequest) => Response | Promise<Response>,
): { fetchImpl: typeof fetch; state: { calls: CapturedRequest[] } } => {
  const state: { calls: CapturedRequest[] } = { calls: [] }
  const fetchImpl: typeof fetch = async (
    url: string | URL | Request,
    init?: RequestInit,
  ) => {
    const urlString = typeof url === "string" ? url : url.toString()
    let body: unknown
    if (init?.body) {
      if (typeof init.body === "string") {
        try {
          body = JSON.parse(init.body)
        } catch {
          body = init.body
        }
      } else {
        body = init.body
      }
    }
    const captured: CapturedRequest = {
      url: urlString,
      method: init?.method ?? "GET",
      body,
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

/**
 * Shared 422 payload for "missing_descriptor" responses. Extracted
 * to avoid sonarjs/no-duplicated-branches between the descriptor
 * mock and the info mock.
 */
const incompatibleMissingPayload = {
  error: "incompatible template",
  code: "incompatible_template",
  cause: "missing_descriptor",
  repo: "deessejs/no-descriptor",
} as const

const mockResponder = (req: CapturedRequest): Response => {
  // /catalog endpoint
  if (req.url.endsWith("/api/v1/registry/catalog")) {
    return jsonResponse(200, { catalog: VALID_CATALOG })
  }

  // /templates/:slug/info endpoint — info()
  const infoMatch = /\/api\/v1\/registry\/templates\/([^/]+)\/info$/.exec(
    req.url,
  )
  if (infoMatch) {
    const slug = decodeURIComponent(infoMatch[1] ?? "")
    switch (slug) {
      case "valid-slug":
        return jsonResponse(200, {
          slug: "valid-slug",
          title: "Valid Slug",
          description: "A test template.",
          layer: "open-community",
          latestVersion: "1.0.0",
          versions: ["1.0.0", "0.9.0", "0.8.0"],
          category: "saas",
          labels: ["nextjs", "test"],
          updatedAt: "2026-09-25T00:00:00Z",
        })
      case "unknown-slug":
        return jsonResponse(404, { error: "not found" })
      case "malformed-slug":
        return jsonResponse(200, { title: "missing fields" })
      case "network-error-slug":
        throw new TypeError("fetch failed: ECONNRESET")
      case "incompatible-info-slug":
        return jsonResponse(422, incompatibleMissingPayload)
      default:
        return jsonResponse(200, {
          slug,
          title: "Default",
          latestVersion: "1.0.0",
          versions: ["1.0.0"],
        })
    }
  }

  // /fetch-descriptor endpoint — branch on the slug in the body
  const slug =
    typeof req.body === "object" && req.body !== null && "slug" in req.body
      ? (req.body as { slug: string }).slug
      : undefined

  switch (slug) {
    case "valid-slug":
      return jsonResponse(200, {
        descriptor: VALID_TEMPLATE,
        files: {
          "package.json":
            "https://raw.githubusercontent.com/deessejs/templates/v1.0.0/valid-template/package.json",
          "src/index.ts":
            "https://raw.githubusercontent.com/deessejs/templates/v1.0.0/valid-template/src/index.ts",
        },
      })

    case "unknown-slug":
      return jsonResponse(404, { error: "not found" })

    case "gated-slug":
      return jsonResponse(401, { error: "auth required" })

    case "malformed-slug":
      return jsonResponse(200, {
        descriptor: { $schema: "wrong", name: 123 },
        files: "not-an-object",
      })

    case "network-error-slug":
      // Throw to simulate a transport failure (e.g. ECONNRESET).
      throw new TypeError("fetch failed: ECONNRESET")

    case "upstream-error-slug":
      return jsonResponse(502, { error: "upstream GitHub down" })

    case "incompatible-missing-slug":
      return jsonResponse(422, incompatibleMissingPayload)

    case "incompatible-invalid-slug":
      return jsonResponse(422, {
        error: "incompatible template",
        code: "incompatible_template",
        cause: "invalid_descriptor",
        repo: "deessejs/bad-descriptor",
      })

    case "incompatible-empty-body-slug":
      // Server emits 422 but no JSON body — defensive path.
      return new Response("not json", { status: 422 })

    case "info-incompatible-missing-slug":
      return jsonResponse(422, incompatibleMissingPayload)

    default:
      return jsonResponse(200, {
        descriptor: VALID_TEMPLATE,
        files: {
          "package.json": "https://example.com/package.json",
          "src/index.ts": "https://example.com/src/index.ts",
        },
      })
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RegistryClient — mock fetch", () => {
  it("getTemplate returns Ok for a valid slug", async () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    const client = createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
    const result = await client.getTemplate("valid-slug")
    expect(result._tag).toBe("Ok")
    if (result._tag === "Ok") {
      expect(result.value.descriptor.name).toBe("valid-template")
      expect(Object.keys(result.value.files)).toEqual([
        "package.json",
        "src/index.ts",
      ])
    }
  })

  it("getTemplate returns RegistryNotFound on 404", async () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    const client = createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
    const result = await client.getTemplate("unknown-slug")
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryNotFound")
    }
  })

  it("getTemplate returns RegistryAuthRequired on 401", async () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    const client = createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
    const result = await client.getTemplate("gated-slug")
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryAuthRequired")
    }
  })

  it("getTemplate returns RegistryInvalidDescriptor on bad payload", async () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    const client = createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
    const result = await client.getTemplate("malformed-slug")
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryInvalidDescriptor")
    }
  })

  it("getTemplate returns RegistryNetworkError on transport failure", async () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    const client = createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
    const result = await client.getTemplate("network-error-slug")
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryNetworkError")
    }
  })

  it("getTemplate returns RegistryFetchFailed on upstream 5xx", async () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    const client = createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
    const result = await client.getTemplate("upstream-error-slug")
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryFetchFailed")
    }
  })

  it("getTemplate returns RegistryIncompatibleTemplate on 422 missing_descriptor", async () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    const client = createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
    const result = await client.getTemplate("incompatible-missing-slug")
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryIncompatibleTemplate")
      if (result.error._tag === "RegistryIncompatibleTemplate") {
        expect(result.error.cause).toBe("missing_descriptor")
        expect(result.error.repo).toBe("deessejs/no-descriptor")
      }
    }
  })

  it("getTemplate returns RegistryIncompatibleTemplate on 422 invalid_descriptor", async () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    const client = createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
    const result = await client.getTemplate("incompatible-invalid-slug")
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryIncompatibleTemplate")
      if (result.error._tag === "RegistryIncompatibleTemplate") {
        expect(result.error.cause).toBe("invalid_descriptor")
      }
    }
  })

  it("getTemplate tolerates a non-JSON 422 body (defensive path)", async () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    const client = createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
    const result = await client.getTemplate("incompatible-empty-body-slug")
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryIncompatibleTemplate")
      if (result.error._tag === "RegistryIncompatibleTemplate") {
        // Falls back to missing_descriptor when cause is unparseable.
        expect(result.error.cause).toBe("missing_descriptor")
      }
    }
  })

  it("info returns Ok with template metadata for a valid slug", async () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    const client = createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
    const result = await client.info("valid-slug")
    expect(result._tag).toBe("Ok")
    if (result._tag === "Ok") {
      expect(result.value.slug).toBe("valid-slug")
      expect(result.value.title).toBe("Valid Slug")
      expect(result.value.versions).toEqual(["1.0.0", "0.9.0", "0.8.0"])
      expect(result.value.category).toBe("saas")
      expect(result.value.layer).toBe("open-community")
    }
  })

  it("info returns RegistryNotFound on 404", async () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    const client = createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
    const result = await client.info("unknown-slug")
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryNotFound")
    }
  })

  it("info returns RegistryInvalidDescriptor on missing fields", async () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    const client = createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
    const result = await client.info("malformed-slug")
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryInvalidDescriptor")
    }
  })

  it("info returns RegistryNetworkError on transport failure", async () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    const client = createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
    const result = await client.info("network-error-slug")
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryNetworkError")
    }
  })

  it("info returns RegistryIncompatibleTemplate on 422", async () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    const client = createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
    const result = await client.info("incompatible-info-slug")
    expect(result._tag).toBe("Err")
    if (result._tag === "Err") {
      expect(result.error._tag).toBe("RegistryIncompatibleTemplate")
    }
  })

  it("listTemplates returns the catalog", async () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    const client = createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
    const result = await client.listTemplates()
    expect(result._tag).toBe("Ok")
    if (result._tag === "Ok") {
      expect(result.value).toHaveLength(2)
      expect(result.value[0]?.slug).toBe("valid-slug")
    }
  })

  it("rejects invalid apiUrl at construction", () => {
    expect(() =>
      createClient({ apiUrl: "not a url" }),
    ).toThrow(/not a valid URL/)
  })

  it("rejects missing apiUrl at construction", () => {
    expect(() =>
      createClient({ apiUrl: "" as unknown as string }),
    ).toThrow(/apiUrl is required/)
  })
})

// ---------------------------------------------------------------------------
// Shared contract suite — runs the same checks as ObjectStore does
// against local-fs and R2.
// ---------------------------------------------------------------------------

runRegistryContractTests("mock-fetch", {
  makeClient: () => {
    const { fetchImpl } = makeMockFetch(mockResponder)
    return createClient({
      apiUrl: "https://api.example.com",
      fetchImpl,
    })
  },
})
