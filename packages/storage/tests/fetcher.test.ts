import { describe, expect, it } from "vitest"

import {
  fetchJson,
  resolveRedirect,
} from "../src/internal/fetcher.js"
import {
  StorageAuthError,
  StorageNetworkError,
  StorageNotFoundError,
} from "../src/errors.js"

/**
 * Build a Response-shaped stub without going through the actual
 * Response constructor. The constructor rejects status codes like
 * 304 (treated as a bodyless protocol status) which makes some
 * HTTP-error-paths awkward to test. Here we satisfy only what
 * `fetchJson` reads: `status`, `ok`, `headers.get(...)`, `json()`.
 */
function makeResponse(init: {
  status: number
  ok?: boolean
  headers?: Record<string, string>
  body?: string
  json?: () => Promise<unknown>
}): Response {
  // Build a `Headers`-shaped object with the methods fetchJson uses.
  const headerMap = new Map(
    Object.entries(init.headers ?? {}).map(([k, v]) => [
      k.toLowerCase(),
      v,
    ]),
  )
  const headerStub = {
    get(name: string): string | null {
      return headerMap.get(name.toLowerCase()) ?? null
    },
    has(name: string): boolean {
      return headerMap.has(name.toLowerCase())
    },
  }
  // The status is read directly via .status; ok() is fall-through.
  const body = init.body ?? ""
  return {
    status: init.status,
    ok: init.ok ?? (init.status >= 200 && init.status < 300),
    headers: headerStub,
    json: init.json ?? (async () => JSON.parse(body)),
  } as unknown as Response
}

describe("fetchJson — happy path", () => {
  it("returns {kind:'ok', body, etag} on 200 with valid JSON", async () => {
    const fetchImpl: typeof fetch = async () =>
      makeResponse({
        status: 200,
        headers: { etag: 'W/"abc123"' },
        body: '{"hello":"world"}',
      })

    const result = await fetchJson<{ hello: string }>(
      "https://registry.deessejs.com/r/x.json",
      { fetchImpl },
    )
    expect(result.kind).toBe("ok")
    if (result.kind === "ok") {
      expect(result.status).toBe(200)
      expect(result.body.hello).toBe("world")
      expect(result.etag).toBe('W/"abc123"')
    }
  })

  it("preserves a null etag when the header is absent", async () => {
    const fetchImpl: typeof fetch = async () =>
      makeResponse({
        status: 200,
        body: '{"x":1}',
      })
    const result = await fetchJson<{ x: number }>(
      "https://registry.deessejs.com/r/x.json",
      { fetchImpl },
    )
    expect(result.kind).toBe("ok")
    if (result.kind === "ok") {
      expect(result.etag).toBeNull()
    }
  })
})

describe("fetchJson — conditional GET", () => {
  /**
   * Capture the request headers as a plain Record. Vitest + undici
   * pass `init.headers` as either a `Headers` instance or a
   * `Record<string,string>` depending on the runtime, so we accept
   * both shapes.
   */
  function recordHeaders(init: RequestInit | undefined): Record<string, string> {
    const out: Record<string, string> = {}
    const h = init?.headers
    if (!h) return out
    if (typeof (h as Headers).forEach === "function") {
      ;(h as Headers).forEach((v, k) => {
        out[k] = v
      })
    } else if (Array.isArray(h)) {
      for (const [k, v] of h) {
        out[k.toLowerCase()] = v
      }
    } else {
      for (const [k, v] of Object.entries(h as Record<string, string>)) {
        out[k.toLowerCase()] = v
      }
    }
    return out
  }

  it("sends If-None-Match when an etag is provided", async () => {
    let observedHeaders: Record<string, string> = {}
    const fetchImpl: typeof fetch = async (_url, init) => {
      observedHeaders = recordHeaders(init)
      return makeResponse({
        status: 304,
        // Server typically echoes the same etag on 304; we don't
        // round-trip it (caller already has it from cache).
        headers: { etag: 'W/"cached"' },
      })
    }

    const result = await fetchJson(
      "https://registry.deessejs.com/r/x.json",
      { etag: 'W/"cached"', fetchImpl },
    )
    expect(result.kind).toBe("not_modified")
    if (result.kind === "not_modified") {
      // Per spec, the etag returned is the one we sent (caller's
      // cached etag is unchanged). The server's response etag is
      // informational and we use the input one to keep the contract
      // stable across 304 round-trips.
      expect(result.etag).toBe('W/"cached"')
    }
    expect(observedHeaders["if-none-match"]).toBe('W/"cached"')
  })

  it("does not send If-None-Match when no etag is provided", async () => {
    let observedHeaders: Record<string, string> = {}
    const fetchImpl: typeof fetch = async (_url, init) => {
      observedHeaders = recordHeaders(init)
      return makeResponse({
        status: 200,
        body: '{"x":1}',
      })
    }
    await fetchJson("https://registry.deessejs.com/r/x.json", { fetchImpl })
    expect(observedHeaders["if-none-match"]).toBeUndefined()
  })

  it("always sends Accept: application/json", async () => {
    let observedHeaders: Record<string, string> = {}
    const fetchImpl: typeof fetch = async (_url, init) => {
      observedHeaders = recordHeaders(init)
      return makeResponse({
        status: 200,
        body: '{"x":1}',
      })
    }
    await fetchJson("https://registry.deessejs.com/r/x.json", { fetchImpl })
    expect(observedHeaders["accept"]).toBe("application/json")
  })

  it("merges caller-supplied headers", async () => {
    let observedHeaders: Record<string, string> = {}
    const fetchImpl: typeof fetch = async (_url, init) => {
      observedHeaders = recordHeaders(init)
      return makeResponse({
        status: 200,
        body: '{"x":1}',
      })
    }
    await fetchJson("https://registry.deessejs.com/r/x.json", {
      fetchImpl,
      headers: { "X-Deessejs-Trace": "test-123" },
    })
    expect(observedHeaders["x-deessejs-trace"]).toBe("test-123")
  })

  it("throws StorageNetworkError on 304 without prior If-None-Match", async () => {
    const fetchImpl: typeof fetch = async () =>
      makeResponse({ status: 304, headers: { etag: 'W/"x"' } })

    await expect(
      fetchJson("https://registry.deessejs.com/r/x.json", { fetchImpl }),
    ).rejects.toThrow(/304 without conditional GET/)
  })
})

describe("fetchJson — error mapping", () => {
  it("404 maps to StorageNotFoundError", async () => {
    const fetchImpl: typeof fetch = async () =>
      makeResponse({ status: 404 })

    await expect(
      fetchJson("https://registry.deessejs.com/r/missing.json", { fetchImpl }),
    ).rejects.toBeInstanceOf(StorageNotFoundError)
  })

  it("401 maps to StorageAuthError", async () => {
    const fetchImpl: typeof fetch = async () =>
      makeResponse({ status: 401 })
    await expect(
      fetchJson("https://registry.deessejs.com/r/x.json", { fetchImpl }),
    ).rejects.toBeInstanceOf(StorageAuthError)
  })

  it("403 maps to StorageAuthError", async () => {
    const fetchImpl: typeof fetch = async () =>
      makeResponse({ status: 403 })
    await expect(
      fetchJson("https://registry.deessejs.com/r/x.json", { fetchImpl }),
    ).rejects.toBeInstanceOf(StorageAuthError)
  })

  it("500 maps to StorageNetworkError", async () => {
    const fetchImpl: typeof fetch = async () =>
      makeResponse({ status: 500 })
    await expect(
      fetchJson("https://registry.deessejs.com/r/x.json", { fetchImpl }),
    ).rejects.toBeInstanceOf(StorageNetworkError)
  })

  it("503 maps to StorageNetworkError", async () => {
    const fetchImpl: typeof fetch = async () =>
      makeResponse({ status: 503 })
    await expect(
      fetchJson("https://registry.deessejs.com/r/x.json", { fetchImpl }),
    ).rejects.toBeInstanceOf(StorageNetworkError)
  })

  it("302 maps to StorageNetworkError (a non-2xx redirect, no manual follow)", async () => {
    const fetchImpl: typeof fetch = async () =>
      makeResponse({ status: 302 })
    await expect(
      fetchJson("https://registry.deessejs.com/r/x.json", { fetchImpl }),
    ).rejects.toBeInstanceOf(StorageNetworkError)
  })

  it("network failure preserves the original cause as Error.cause", async () => {
    const originalError = new Error("ECONNREFUSED 127.0.0.1")
    const fetchImpl: typeof fetch = async () => {
      throw originalError
    }
    try {
      await fetchJson("https://registry.deessejs.com/r/x.json", { fetchImpl })
      throw new Error("should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(StorageNetworkError)
      expect((e as Error & { cause?: unknown }).cause).toBe(originalError)
    }
  })

  it("malformed JSON preserves the JSON.parse SyntaxError as cause", async () => {
    const fetchImpl: typeof fetch = async () =>
      makeResponse({
        status: 200,
        body: "not { json",
      })
    try {
      await fetchJson<unknown>("https://registry.deessejs.com/r/x.json", {
        fetchImpl,
      })
      throw new Error("should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(StorageNetworkError)
      expect((e as Error & { cause?: unknown }).cause).toBeInstanceOf(SyntaxError)
    }
  })

  it("network-error messages include the URL for debuggability", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error("connect timeout")
    }
    try {
      await fetchJson(
        "https://registry.deessejs.com/r/specific-item.json",
        { fetchImpl },
      )
      throw new Error("should have thrown")
    } catch (e) {
      expect((e as Error).message).toContain(
        "https://registry.deessejs.com/r/specific-item.json",
      )
    }
  })
})

describe("resolveRedirect", () => {
  it("returns the final URL after follow", async () => {
    // undici's Response tracks the final URL via the .url getter, which
    // is normally set by the redirect-follow pipeline. In a unit test
    // we can short-circuit by providing a fetchImpl that returns a
    // Response whose `.url` getter we override. We achieve this by
    // stubbing via an object that satisfies only what `res.url` reads.
    const fakeResponse = {
      url: "https://registry.deessejs.com/r/resolved-v1.4.0.json",
    } as unknown as Response
    const fetchImpl: typeof fetch = async () => fakeResponse
    const finalUrl = await resolveRedirect(
      "https://registry.deessejs.com/r/foo/latest.json",
      { fetchImpl },
    )
    expect(finalUrl).toBe(
      "https://registry.deessejs.com/r/resolved-v1.4.0.json",
    )
  })
})
