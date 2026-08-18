/**
 * Integration test for the version probe.
 *
 * Per ADR-016, exercises the real `api` Hono object via
 * `api.request()`. Pins the shape of `/api/v1/version` against
 * the constants in `packages/api/src/constants/version.ts`,
 * asserts the cache headers are set, and confirms the rate-limit
 * middleware runs on this route.
 */
import { describe, expect, it } from "vitest"

import { api } from "../../src/index.js"
import {
  VERSION,
  MIN_SUPPORTED_VERSION,
} from "../../src/constants/version.js"

describe("GET /api/v1/version", () => {
  it("returns 200 with the declared version and minSupported", async () => {
    const res = await api.request("/api/v1/version")
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      version: VERSION,
      minSupported: MIN_SUPPORTED_VERSION,
    })
  })

  it("sets a Cache-Control header of at least 600 seconds", async () => {
    const res = await api.request("/api/v1/version")
    const cacheControl = res.headers.get("Cache-Control") ?? ""
    // The handler sets `public, max-age=600, stale-while-revalidate=86400`.
    // We assert the max-age fragment survives whatever proxy/CDN adds.
    expect(cacheControl).toMatch(/max-age=600/)
  })

  it("returns the rate-limit headers from the middleware", async () => {
    const res = await api.request("/api/v1/version")
    // The rate-limit middleware sets X-RateLimit-Limit / -Remaining / -Reset
    // on every response. Their presence proves the middleware actually
    // touched the response, not just that the route returned 200.
    expect(res.headers.get("X-RateLimit-Limit")).toBeTruthy()
    expect(res.headers.get("X-RateLimit-Remaining")).toBeTruthy()
    expect(res.headers.get("X-RateLimit-Reset")).toBeTruthy()
  })
})
