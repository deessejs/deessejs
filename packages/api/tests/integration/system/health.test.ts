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
      // The DB ping runs through the same connection pool the
      // migration job used. On a cold first query, the pool may
      // need a moment to settle. Retry up to 3 times with a short
      // backoff so the test is not flaky.
      let res: Response | undefined
      for (let attempt = 0; attempt < 3; attempt++) {
        res = await api.request("/api/v1/ready")
        if (res.status === 200) break
        await new Promise((r) => setTimeout(r, 200))
      }
      expect(res?.status).toBe(200)
      const body = await res!.json()
      expect(body.status).toBe("ready")
    })
  }
})
