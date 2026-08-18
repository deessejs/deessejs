/**
 * Integration test for the Hono basePath decision.
 *
 * Per ADR-016 and ADR-011, the API is built with
 * `new Hono<ApiEnv>().basePath("/api/v1")`. This test pins that
 * decision: hitting any known route without the prefix returns
 * 404, hitting it with the prefix returns 200.
 *
 * A regression that silently drops the prefix (e.g. someone
 * refactors away from `basePath`) would surface here as a 404
 * on every known route, not as a 502 or a confusing wire error.
 */
import { describe, expect, it } from "vitest"

import { api } from "../../src/index.js"

describe("Hono basePath /api/v1", () => {
  it("serves /api/v1/health", async () => {
    const res = await api.request("/api/v1/health")
    expect(res.status).toBe(200)
  })

  it("serves /api/v1/version", async () => {
    const res = await api.request("/api/v1/version")
    expect(res.status).toBe(200)
  })

  it("returns 404 for /health (no prefix)", async () => {
    const res = await api.request("/health")
    expect(res.status).toBe(404)
  })

  it("returns 404 for /version (no prefix)", async () => {
    const res = await api.request("/version")
    expect(res.status).toBe(404)
  })

  it("returns 404 for /ready (no prefix)", async () => {
    const res = await api.request("/ready")
    expect(res.status).toBe(404)
  })

  it("returns 404 for /rpc/templates/list (no prefix)", async () => {
    const res = await api.request("/rpc/templates/list", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: null, path: ["templates", "list"] }),
    })
    expect(res.status).toBe(404)
  })
})
