import { describe, expect, it } from "vitest"
import { api } from "../src/index.js"

describe("cache and rate limit", () => {
  describe("/api/v1/templates ETag and Cache-Control", () => {
    it("returns an ETag on first response", async () => {
      const res = await api.request("/api/v1/templates")
      expect(res.status).toBe(200)
      const etag = res.headers.get("ETag")
      expect(etag).toBeTruthy()
      expect(etag).toMatch(/^W\/"v\d+"$/)
    })

    it("sets Cache-Control with public + stale-while-revalidate", async () => {
      const res = await api.request("/api/v1/templates")
      const cache = res.headers.get("Cache-Control")
      expect(cache).toContain("public")
      expect(cache).toContain("max-age=")
      expect(cache).toContain("stale-while-revalidate=")
    })

    it("returns 304 when If-None-Match matches the current ETag", async () => {
      const first = await api.request("/api/v1/templates")
      const etag = first.headers.get("ETag")
      expect(etag).toBeTruthy()

      const second = await api.request("/api/v1/templates", {
        headers: { "If-None-Match": etag! },
      })
      expect(second.status).toBe(304)
      const body = await second.text()
      expect(body).toBe("")
      expect(second.headers.get("ETag")).toBe(etag)
    })

    it("returns 200 when If-None-Match does not match", async () => {
      const res = await api.request("/api/v1/templates", {
        headers: { "If-None-Match": `W/"v999"` },
      })
      expect(res.status).toBe(200)
    })
  })

  describe("/api/v1/templates rate limit", () => {
    it("sets X-RateLimit-Limit/Remaining/Reset headers", async () => {
      const res = await api.request("/api/v1/templates", {
        headers: { "X-Forwarded-For": "10.0.0.1" },
      })
      expect(res.headers.get("X-RateLimit-Limit")).toBe("100")
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("99")
      expect(Number(res.headers.get("X-RateLimit-Reset"))).toBeGreaterThan(0)
    })

    it("returns 429 with the standard envelope after the limit is exceeded", async () => {
      // Distinct IP per test so the bucket starts clean and we don't
      // collide with other tests in the same suite.
      const ip = "10.0.0.2"
      let lastSuccess: Response | null = null
      for (let i = 0; i < 100; i++) {
        lastSuccess = await api.request("/api/v1/templates", {
          headers: { "X-Forwarded-For": ip },
        })
      }
      expect(lastSuccess!.status).toBe(200)

      const over = await api.request("/api/v1/templates", {
        headers: { "X-Forwarded-For": ip },
      })
      expect(over.status).toBe(429)
      const body = await over.json()
      expect(body).toMatchObject({
        code: "rate_limited",
        message: expect.any(String),
        requestId: expect.any(String),
      })
      expect(over.headers.get("X-RateLimit-Remaining")).toBe("0")
    })
  })

  describe("/api/v1/cli-version", () => {
    it("returns the current CLI version and the minimum supported version", async () => {
      const res = await api.request("/api/v1/cli-version")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.version).toMatch(/^\d+\.\d+\.\d+$/)
      expect(body.minSupported).toMatch(/^\d+\.\d+\.\d+$/)
    })

    it("is rate-limited (per-IP, like /templates)", async () => {
      const res = await api.request("/api/v1/cli-version", {
        headers: { "X-Forwarded-For": "10.0.0.3" },
      })
      expect(res.headers.get("X-RateLimit-Limit")).toBe("100")
    })

    it("does not set an ETag (cli-version changes only at release time, no need for byte-level cache)", async () => {
      const res = await api.request("/api/v1/cli-version")
      expect(res.headers.get("ETag")).toBeNull()
      // But it does set a Cache-Control so the CDN caches the version probe.
      expect(res.headers.get("Cache-Control")).toContain("max-age=")
    })
  })
})
