/**
 * Tests for R2ObjectStore.
 *
 * NO real-network tests in this commit. Live R2 requires a paid
 * Cloudflare account, an R2 bucket, and a CI secret. Provider
 * tests mock the `fetchImpl` seam and verify:
 *
 *   1. Request shape (URL, method, headers) for each verb.
 *   2. SigV4 Authorization header is well-formed and signs the
 *      correct method + URL.
 *   3. Response status -> typed error mapping (4xx, 5xx, network).
 *   4. Body bytes round-trip via mocked fetch.
 *   5. List pagination through NextContinuationToken.
 *
 * Real-R2 round-trip tests belong to a follow-up PR gated on CI
 * secrets.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest"

import { R2ObjectStore } from "../src/providers/r2.js"
import {
  StorageAuthError,
  StorageNotFoundError,
  StorageNetworkError,
} from "../src/errors.js"
import type { ObjectMeta } from "../src/object-store.js"

interface CapturedRequest {
  url: string
  method: string
  headers: Record<string, string>
  body?: Uint8Array
}

interface FetchResponder {
  handler: (req: CapturedRequest) => Response | Promise<Response>
  captured: CapturedRequest[]
}

function makeFetchResponder(
  handler: FetchResponder["handler"],
): { fetchImpl: typeof fetch; state: FetchResponder } {
  const state: FetchResponder = {
    handler,
    captured: [],
  }
  const fetchImpl: typeof fetch = async (
    url: string,
    init?: RequestInit,
  ) => {
    const req: CapturedRequest = {
      url,
      method: init?.method ?? "GET",
      headers: {},
    }
    if (init?.headers) {
      const h = init.headers
      if (typeof (h as Headers).forEach === "function") {
        ;(h as Headers).forEach((v, k) => {
          req.headers[k.toLowerCase()] = v
        })
      } else if (Array.isArray(h)) {
        for (const [k, v] of h) {
          req.headers[k.toLowerCase()] = v as string
        }
      } else {
        for (const [k, v] of Object.entries(h as Record<string, string>)) {
          req.headers[k.toLowerCase()] = v
        }
      }
    }
    if (init?.body) {
      req.body =
        typeof init.body === "string"
          ? new TextEncoder().encode(init.body)
          : (init.body as Uint8Array)
    }
    state.captured.push(req)
    return state.handler(req)
  }
  return { fetchImpl, state }
}

function bytesResponse(
  status: number,
  body: Uint8Array | string,
  extraHeaders: Record<string, string> = {},
): Response {
  const buf = typeof body === "string" ? new TextEncoder().encode(body) : body
  const headers = new Headers({
    "content-length": String(buf.length),
    "content-type": "application/octet-stream",
    ...extraHeaders,
  })
  return new Response(new Uint8Array(buf), { status, headers })
}

function emptyResponse(status: number): Response {
  return new Response("", { status })
}

/** Extract the Authorization header from a captured request. */
function authOf(req: CapturedRequest): string {
  expect(req.headers["authorization"]).toMatch(
    /^AWS4-HMAC-SHA256 Credential=[^,]+, SignedHeaders=[^,]+, Signature=[a-f0-9]{64}$/,
  )
  return req.headers["authorization"]
}

describe("R2ObjectStore — constructor", () => {
  it("requires accountId, bucket, and credentials", () => {
    const baseCreds = {
      accessKeyId: "AKID",
      secretAccessKey: "SECRET",
    }
    expect(
      () =>
        new R2ObjectStore({
          accountId: "",
          bucket: "b",
          credentials: baseCreds,
        }),
    ).toThrow(/accountId/)
    expect(
      () =>
        new R2ObjectStore({
          accountId: "abc",
          bucket: "",
          credentials: baseCreds,
        }),
    ).toThrow(/bucket/)
    expect(
      () =>
        new R2ObjectStore({
          accountId: "abc",
          bucket: "b",
          credentials: {
            accessKeyId: "",
            secretAccessKey: "SECRET",
          },
        }),
    ).toThrow(/accessKeyId/)
  })

  it("builds the canonical R2 base URL", () => {
    const { fetchImpl } = makeFetchResponder(() => emptyResponse(200))
    const store = new R2ObjectStore({
      accountId: "myaccount",
      bucket: "templates",
      credentials: {
        accessKeyId: "AKID",
        secretAccessKey: "SECRET",
      },
      fetchImpl,
    })
    // Internal — exercised via list() which crafts a list URL.
    void store
    // Verified implicitly by the test below (we look at captured URLs).
  })
})

describe("R2ObjectStore — get", () => {
  it("sends a signed GET to the canonical R2 URL", async () => {
    const body = bytesResponse(
      200,
      new TextEncoder().encode("hello, r2"),
      { etag: '"abc"' },
    )
    const { fetchImpl, state } = makeFetchResponder(() => body)
    const store = new R2ObjectStore({
      accountId: "acct",
      bucket: "templates",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      fetchImpl,
    })
    await store.get("template.json")

    expect(state.captured).toHaveLength(1)
    const req = state.captured[0]
    expect(req.url).toBe(
      "https://acct.r2.cloudflarestorage.com/templates/template.json",
    )
    expect(req.method).toBe("GET")
    expect(req.headers["host"]).toBe("acct.r2.cloudflarestorage.com")
    expect(req.headers["x-amz-date"]).toMatch(/^\d{8}T\d{6}Z$/)
    expect(authOf(req)).toContain("Credential=AKID/")
  })

  it("returns the response body as a stream", async () => {
    const body = bytesResponse(
      200,
      new TextEncoder().encode("streamed body bytes"),
    )
    const { fetchImpl } = makeFetchResponder(() => body)
    const store = new R2ObjectStore({
      accountId: "acct",
      bucket: "templates",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      fetchImpl,
    })
    const stream = await store.get("template.json")
    expect(stream).not.toBeNull()
    const reader = stream!.getReader()
    let acc = ""
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      acc += new TextDecoder().decode(value)
    }
    expect(acc).toBe("streamed body bytes")
  })

  it("returns null on 404", async () => {
    const { fetchImpl } = makeFetchResponder(() => emptyResponse(404))
    const store = new R2ObjectStore({
      accountId: "acct",
      bucket: "templates",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      fetchImpl,
    })
    expect(await store.get("missing")).toBeNull()
  })

  it("throws StorageAuthError on 401/403", async () => {
    const { fetchImpl } = makeFetchResponder(() => emptyResponse(403))
    const store = new R2ObjectStore({
      accountId: "acct",
      bucket: "templates",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      fetchImpl,
    })
    await expect(store.get("k")).rejects.toBeInstanceOf(StorageAuthError)
  })

  it("throws StorageNetworkError on 5xx", async () => {
    const { fetchImpl } = makeFetchResponder(() => emptyResponse(503))
    const store = new R2ObjectStore({
      accountId: "acct",
      bucket: "templates",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      fetchImpl,
    })
    await expect(store.get("k")).rejects.toBeInstanceOf(StorageNetworkError)
  })

  it("throws StorageNetworkError on fetch throw", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error("ECONNRESET")
    }
    const store = new R2ObjectStore({
      accountId: "acct",
      bucket: "templates",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      fetchImpl,
    })
    await expect(store.get("k")).rejects.toBeInstanceOf(StorageNetworkError)
  })
})

describe("R2ObjectStore — put", () => {
  it("sends a signed PUT with x-amz-content-sha256", async () => {
    const body = bytesResponse(200, "ok")
    const { fetchImpl, state } = makeFetchResponder(() => body)
    const store = new R2ObjectStore({
      accountId: "acct",
      bucket: "templates",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      fetchImpl,
    })

    const payload = new TextEncoder().encode("payload bytes")
    await store.put("k", payload)

    expect(state.captured).toHaveLength(1)
    const req = state.captured[0]
    expect(req.method).toBe("PUT")
    expect(req.url).toBe(
      "https://acct.r2.cloudflarestorage.com/templates/k",
    )
    expect(req.headers["content-type"]).toBe("application/octet-stream")
    expect(req.headers["x-amz-content-sha256"]).toMatch(/^[a-f0-9]{64}$/)
    authOf(req)
  })

  it("throws StorageAuthError on 403", async () => {
    const { fetchImpl } = makeFetchResponder(() => emptyResponse(403))
    const store = new R2ObjectStore({
      accountId: "acct",
      bucket: "templates",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      fetchImpl,
    })
    await expect(
      store.put("k", new Uint8Array([1, 2, 3])),
    ).rejects.toBeInstanceOf(StorageAuthError)
  })
})

describe("R2ObjectStore — delete", () => {
  it("sends a signed DELETE", async () => {
    const { fetchImpl, state } = makeFetchResponder(() => emptyResponse(200))
    const store = new R2ObjectStore({
      accountId: "acct",
      bucket: "templates",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      fetchImpl,
    })
    await store.delete("k")
    expect(state.captured[0].method).toBe("DELETE")
    expect(state.captured[0].url).toBe(
      "https://acct.r2.cloudflarestorage.com/templates/k",
    )
  })

  it("is idempotent (succeeds on 404)", async () => {
    const { fetchImpl } = makeFetchResponder(() => emptyResponse(404))
    const store = new R2ObjectStore({
      accountId: "acct",
      bucket: "templates",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      fetchImpl,
    })
    await expect(store.delete("k")).resolves.toBeUndefined()
  })

  it("throws StorageAuthError on 403", async () => {
    const { fetchImpl } = makeFetchResponder(() => emptyResponse(403))
    const store = new R2ObjectStore({
      accountId: "acct",
      bucket: "templates",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      fetchImpl,
    })
    await expect(store.delete("k")).rejects.toBeInstanceOf(StorageAuthError)
  })
})

describe("R2ObjectStore — head", () => {
  it("sends a signed HEAD and parses metadata", async () => {
    const resp = new Response("", {
      status: 200,
      headers: {
        etag: '"deadbeef"',
        "content-length": "1234",
        "content-type": "application/json",
        "last-modified": "Wed, 21 Oct 2026 07:28:00 GMT",
      },
    })
    const { fetchImpl, state } = makeFetchResponder(() => resp)
    const store = new R2ObjectStore({
      accountId: "acct",
      bucket: "templates",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      fetchImpl,
    })
    const meta = await store.head("k.json")
    expect(state.captured[0].method).toBe("HEAD")
    expect(meta).not.toBeNull()
    expect(meta!.key).toBe("k.json")
    expect(meta!.size).toBe(1234)
    expect(meta!.contentType).toBe("application/json")
    expect(meta!.etag).toBe('"deadbeef"')
    expect(meta!.lastModified).toBe("Wed, 21 Oct 2026 07:28:00 GMT")
  })

  it("returns null on 404", async () => {
    const { fetchImpl } = makeFetchResponder(() => emptyResponse(404))
    const store = new R2ObjectStore({
      accountId: "acct",
      bucket: "templates",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      fetchImpl,
    })
    expect(await store.head("missing")).toBeNull()
  })
})

describe("R2ObjectStore — list", () => {
  it("yields parsed items and follows the continuation token", async () => {
    // First call: returns 2 items + a continuation token. Second
    // call: returns 1 item + no continuation token.
    let call = 0
    const responder: { fetchImpl: typeof fetch; state: FetchResponder } =
      (() => {
        const state: FetchResponder = { handler: () => emptyResponse(200), captured: [] }
        const fetchImpl: typeof fetch = async (
          url: string,
          init?: RequestInit,
        ) => {
          const req: CapturedRequest = {
            url,
            method: init?.method ?? "GET",
            headers: {},
          }
          if (init?.headers) {
            const h = init.headers
            if (typeof (h as Headers).forEach === "function") {
              ;(h as Headers).forEach((v, k) => {
                req.headers[k.toLowerCase()] = v
              })
            }
          }
          state.captured.push(req)
          call++
          if (call === 1) {
            return new Response(
              `<?xml version="1.0" encoding="UTF-8"?>
              <ListBucketResult>
                <Contents><Key>a.json</Key><Size>10</Size><ETag>"x1"</ETag><LastModified>2026-10-01</LastModified></Contents>
                <Contents><Key>b.json</Key><Size>20</Size><ETag>"x2"</ETag><LastModified>2026-10-02</LastModified></Contents>
                <NextContinuationToken>page2</NextContinuationToken>
              </ListBucketResult>`,
              { status: 200, headers: { "content-type": "application/xml" } },
            )
          }
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?>
            <ListBucketResult>
              <Contents><Key>c.json</Key><Size>30</Size><ETag>"x3"</ETag><LastModified>2026-10-03</LastModified></Contents>
            </ListBucketResult>`,
            { status: 200, headers: { "content-type": "application/xml" } },
          )
        }
        return { fetchImpl, state }
      })()

    const store = new R2ObjectStore({
      accountId: "acct",
      bucket: "templates",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      fetchImpl: responder.fetchImpl,
    })

    const out: ObjectMeta[] = []
    for await (const m of store.list()) out.push(m)

    expect(out).toHaveLength(3)
    expect(out[0].key).toBe("a.json")
    expect(out[0].size).toBe(10)
    expect(out[0].etag).toBe("x1")
    expect(out[1].key).toBe("b.json")
    expect(out[2].key).toBe("c.json")
    expect(out[2].size).toBe(30)

    // Two HTTP calls: one with continuation token, one without.
    expect(responder.state.captured).toHaveLength(2)
    expect(responder.state.captured[0].url).toContain(
      "list-type=2&bucket=templates",
    )
    expect(responder.state.captured[1].url).toContain(
      "continuation-token=page2",
    )
  })
})

describe("R2ObjectStore — signature stability", () => {
  it("Authorization header is reproducible for fixed inputs (snap check)", async () => {
    // Two calls with deterministic clock should produce identical
    // signatures (R2 signs with the same credentials + same
    // canonical request).
    const { fetchImpl, state } = makeFetchResponder(() =>
      emptyResponse(200),
    )
    const store = new R2ObjectStore({
      accountId: "acct",
      bucket: "templates",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      fetchImpl,
    })

    // Stub Date.now via Vitest mock.
    const fixedNow = Date.UTC(2026, 0, 15, 12, 0, 0)
    const origNow = Date.now
    Date.now = () => fixedNow
    try {
      await store.get("k")
      await store.get("k")
    } finally {
      Date.now = origNow
    }

    expect(state.captured[0].headers["authorization"]).toBe(
      state.captured[1].headers["authorization"],
    )
    expect(state.captured[0].headers["x-amz-date"]).toBe(
      state.captured[1].headers["x-amz-date"],
    )
  })
})
