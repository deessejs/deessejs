/**
 * Integration tests for the Hono system health routes.
 *
 * Per the api CI integration tests, exercises the real `api`
 * Hono object via `api.request()`. The readiness test reads the
 * `postgres:ready` flag from `globalSetup` and skips loudly when
 * false.
 *
 * Routes tested:
 *   - GET /api/v1/health  (liveness, no DB)
 *   - GET /api/v1/ready   (readiness, pings Postgres)
 *
 * The Hono `basePath("/api/v1")` is asserted by the tests below
 * by hitting the full path. A regression that drops the prefix
 * surfaces as a 404 with the notFound envelope, which is also
 * asserted in `routing/not-found.test.ts`.
 */
import { describe, expect, it, vi } from "vitest"
import { inject } from "vitest"

import { auth } from "@workspace/auth"
import { api } from "../../../src/index.js"

const POSTGRES_READY = inject("postgres:ready") === true

describe("GET /api/v1/health", () => {
  it("returns 200 with status ok", async () => {
    const res = await api.request("/api/v1/health")
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe("ok")
    expect(typeof body.timestamp).toBe("string")
  })

  it("does not resolve a session when session storage is unavailable", async () => {
    const getSession = vi
      .spyOn(auth.api, "getSession")
      .mockRejectedValue(new Error("Session storage is unavailable"))

    try {
      const res = await api.request("/api/v1/health")

      expect(res.status).toBe(200)
      expect(getSession).not.toHaveBeenCalled()
    } finally {
      getSession.mockRestore()
    }
  })
})

describe("GET /api/v1/ready", () => {
  if (!POSTGRES_READY) {
    it.skip("[skip-postgres] readiness ping requires a reachable Postgres", () => {
      // Loud skip: the test name carries the [skip-postgres] annotation
      // and the global setup emits a WARN. A misconfigured CI is visible.
    })
  } else {
    it("returns 200 with status ready when Postgres is reachable", async () => {
      // `db.execute(sql\`SELECT 1\`)` throws on connection failure
      // (ECONNREFUSED, ETIMEDOUT, pool exhaustion); the route's
      // catch returns 503 with `{ status: "not ready" }`. With
      // Postgres reachable, the proxy in
      // `packages/database/src/client.ts` succeeds and the route
      // returns 200. See the integration test harness notes for the
      // schema behind the readiness route.
      const res = await api.request("/api/v1/ready")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe("ready")
    })
  }
})
