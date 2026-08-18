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
 * returns 200 with the literal body `null` (JSON). Verified
 * against the CI integration job output (2026-08-18): the
 * response body for an unauthenticated `/get-session` call
 * is `null`. If Better Auth changes the envelope shape, this
 * test fails and surfaces the change immediately.
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
    it("is mounted and returns 200 with body null for an unauthenticated request", async () => {
      const res = await api.request("/api/v1/auth/get-session")
      expect(res.status).toBe(200)
      const body = await res.json()
      // Pin the envelope. The literal `null` body is what
      // Better Auth returns for an unauthenticated request
      // when the Hono↔Better Auth boundary is wired correctly
      // (verified against the pinned `basePath: "/api/v1/auth"`
      // in `packages/auth/src/auth.ts`). A different envelope
      // (e.g. `{ session: null, user: null }`) is a regression.
      expect(body).toBeNull()
    })
  }
})
