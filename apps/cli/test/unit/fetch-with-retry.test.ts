import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fetchWithRetry } from "../../src/api/retry.js"

describe("fetchWithRetry", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns the response on 200 without retrying", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("ok", { status: 200, headers: { ETag: 'W/"v1"' } }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await fetchWithRetry({ apiUrl: "http://x" })
    expect(res.status).toBe(200)
    expect(res.bodyText).toBe("ok")
    expect(res.etag).toBe('W/"v1"')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("retries on 5xx and returns the final response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("err", { status: 500 }))
      .mockResolvedValueOnce(new Response("err", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }))

    vi.stubGlobal("fetch", fetchMock)
    const res = await fetchWithRetry({ apiUrl: "http://x" })
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it("aborts on 4xx without retrying", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("not found", { status: 404 }),
    )
    vi.stubGlobal("fetch", fetchMock)
    const res = await fetchWithRetry({ apiUrl: "http://x" })
    expect(res.status).toBe(404)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("retries on 429 and honors X-RateLimit-Reset", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("rate limited", {
          status: 429,
          headers: { "X-RateLimit-Reset": "1" },
        }),
      )
      .mockResolvedValueOnce(new Response("ok", { status: 200 }))

    vi.stubGlobal("fetch", fetchMock)
    const start = Date.now()
    const res = await fetchWithRetry({ apiUrl: "http://x" })
    const elapsed = Date.now() - start

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    // We sleep ~1s for the X-RateLimit-Reset; the test should not take
    // much longer than that, but allow some slack for CI.
    expect(elapsed).toBeGreaterThanOrEqual(900)
    expect(elapsed).toBeLessThan(5_000)
  })

  it("retries on network error and ultimately throws", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"))
    vi.stubGlobal("fetch", fetchMock)

    await expect(
      fetchWithRetry({ apiUrl: "http://x", maxAttempts: 2 }),
    ).rejects.toThrow(/ECONNREFUSED/)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("sends the provided headers on every attempt", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    await fetchWithRetry({
      apiUrl: "http://x",
      headers: { "If-None-Match": 'W/"v1"' },
    })
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect((init.headers as Record<string, string>)["If-None-Match"]).toBe(
      'W/"v1"',
    )
  })
})
