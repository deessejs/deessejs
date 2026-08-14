import { describe, expect, it } from "vitest"
import { Hono } from "hono"

describe("API routes", () => {
  describe("health endpoints", () => {
    it("should have health check pattern", async () => {
      const app = new Hono()
      app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))

      const res = await app.request("/health")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe("ok")
      expect(body.timestamp).toBeDefined()
    })

    it("should have ready check pattern", async () => {
      const app = new Hono()
      app.get("/ready", async (c) => {
        try {
          return c.json({ status: "ready" })
        } catch {
          return c.json({ status: "not ready" }, 503)
        }
      })

      const res = await app.request("/ready")
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ status: "ready" })
    })
  })

  describe("CORS configuration", () => {
    it("should handle CORS headers", async () => {
      const app = new Hono()
      app.use("*", async (c, next) => {
        c.header("Access-Control-Allow-Origin", "*")
        await next()
      })
      app.get("/test", (c) => c.json({ ok: true }))

      const res = await app.request("/test")
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })
  })

  describe("error handling", () => {
    it("should return 404 for unknown routes", async () => {
      const app = new Hono()
      app.on(["POST", "GET"], "/rpc/*", async (c) => {
        return c.json({ error: "Not found" }, 404)
      })

      const res = await app.request("/rpc/unknown")
      expect(res.status).toBe(404)
      expect(await res.json()).toEqual({ error: "Not found" })
    })
  })
})
