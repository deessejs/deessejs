/**
 * Integration tests for the Hono system health routes.
 *
 * Per ADR-016, exercises the real `api` Hono object via
 * `api.request()`. The readiness test reads the `postgres:ready`
 * flag from `globalSetup` and skips loudly when false.
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
import { describe, expect, it } from "vitest"
import { inject } from "vitest"

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
})

describe("GET /api/v1/ready", () => {
  if (!POSTGRES_READY) {
    it.skip("[skip-postgres] readiness ping requires a reachable Postgres", () => {
      // Loud skip: the test name carries the [skip-postgres] annotation
      // and the global setup emits a WARN. A misconfigured CI is visible.
    })
  } else {
    it("returns 200 with status ready when Postgres is reachable", async () => {
      // The pool is warmed by `globalSetup` (round-4 amendment:
      // it runs a real `SELECT 1` against the same postgres
      // client config the app uses). The first query from the
      // readiness route hits a warm pool and returns 200.
      const res = await api.request("/api/v1/ready")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe("ready")
    })
  }
})
