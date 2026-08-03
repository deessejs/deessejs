import { describe, expect, it } from "vitest"
import { api } from "../src/index.js"

// The Hono app is created with `.basePath(API_BASE_PATH)` (= "/api/v1"),
// which only matters for routing — `api.request()` in tests bypasses the
// Next.js catch-all, so it must be given the full path including the
// base path. (In production, `handle(api)` from hono/vercel strips the
// base path before delegating to Hono.)

describe("observability middleware", () => {
  describe("X-Request-Id", () => {
    it("mints a UUID when the request has no X-Request-Id header", async () => {
      const res = await api.request("/api/v1/health")
      const id = res.headers.get("X-Request-Id")
      expect(id).toBeTruthy()
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
    })

    it("propagates a caller-supplied X-Request-Id", async () => {
      const res = await api.request("/api/v1/health", {
        headers: { "X-Request-Id": "req_test_propagate" },
      })
      expect(res.headers.get("X-Request-Id")).toBe("req_test_propagate")
    })

    it("returns different IDs for two unrelated requests", async () => {
      const [a, b] = await Promise.all([
        api.request("/api/v1/health"),
        api.request("/api/v1/health"),
      ])
      expect(a.headers.get("X-Request-Id")).not.toBe(b.headers.get("X-Request-Id"))
    })
  })

  describe("secure headers", () => {
    it("sets X-Content-Type-Options: nosniff", async () => {
      const res = await api.request("/api/v1/health")
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff")
    })

    it("sets Strict-Transport-Security", async () => {
      const res = await api.request("/api/v1/health")
      expect(res.headers.get("Strict-Transport-Security")).toBeTruthy()
    })

    it("sets Referrer-Policy", async () => {
      const res = await api.request("/api/v1/health")
      expect(res.headers.get("Referrer-Policy")).toBeTruthy()
    })
  })

  describe("global error handler", () => {
    it("returns a stable error envelope for unknown routes", async () => {
      const res = await api.request("/api/v1/does-not-exist")
      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body).toMatchObject({
        code: "not_found",
        message: expect.any(String),
        requestId: expect.any(String),
      })
    })

    it("includes the requestId in the error envelope", async () => {
      const res = await api.request("/api/v1/does-not-exist", {
        headers: { "X-Request-Id": "req_test_error" },
      })
      const body = await res.json()
      expect(body.requestId).toBe("req_test_error")
    })
  })
})
