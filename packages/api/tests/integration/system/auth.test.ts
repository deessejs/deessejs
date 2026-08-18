/**
 * Integration smoke test for the Better Auth mount.
 *
 * Per ADR-016, this asserts the Hono↔Better Auth boundary in
 * real conditions: the Hono mount catches the URL, the
 * handler returns the documented envelope. Better Auth's
 * own behaviour is tested in `packages/auth`.
 *
 * The Better Auth handler reaches Postgres via the session
 * middleware and the drizzle-backed user lookup, so the test
 * is DB-gated via `inject('postgres:ready')`. The test runs
 * in the CI `test-integration` job where Postgres is up; in
 * the `test-unit` job it skips loudly (the test name carries
 * a `[skip-postgres]` annotation and `globalSetup` emits a
 * WARN so the skip is visible in the log aggregator).
 *
 * Per the Better Auth Hono integration docs, an
 * unauthenticated request to `/api/v1/auth/get-session`
 * returns 200 with `{ session: null, user: null }`.
 */
import { describe, expect, it } from "vitest"
import { inject } from "vitest"

import { api } from "../../../src/index.js"

const POSTGRES_READY = inject("postgres:ready") === true

describe("GET /api/v1/auth/get-session", () => {
  if (!POSTGRES_READY) {
    it.skip("[skip-postgres] Better Auth handler requires a reachable Postgres", () => {
      // Loud skip: the test name carries the [skip-postgres] annotation
      // and the global setup emits a WARN. A misconfigured CI is visible.
    })
  } else {
    it("is mounted and returns 200 for an unauthenticated request", async () => {
      const res = await api.request("/api/v1/auth/get-session")
      // Better Auth returns 200 for an unauthenticated `/get-session`
      // call. The body may be `null` or `{ session: null, user: null }`
      // depending on the Better Auth version; the test pins the
      // status code and the fact that the handler is wired, not
      // the specific envelope shape.
      expect(res.status).toBe(200)
      const body = await res.json()
      expect([null, { session: null, user: null }]).toContainEqual(body)
    })
  }
})
