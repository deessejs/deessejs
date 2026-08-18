/**
 * Integration smoke test for the Better Auth mount.
 *
 * Per ADR-016: asserts the Better Auth handler is wired into
 * the Hono app under `/api/v1/auth/*` (mountHttp:57). The
 * point is to catch a regression in the Hono mount, not to
 * retest Better Auth itself — `packages/auth` covers that.
 *
 * Per the Better Auth Hono integration docs, an unauthenticated
 * request to `/api/v1/auth/get-session` returns 200 with a
 * session payload whose session/user are null. The exact
 * envelope shape is owned by Better Auth; we only assert the
 * documented contract.
 */
import { describe, expect, it } from "vitest"

import { api } from "../../../src/index.js"

describe("GET /api/v1/auth/get-session", () => {
  it("is mounted and returns 200 for an unauthenticated request", async () => {
    const res = await api.request("/api/v1/auth/get-session")
    expect(res.status).toBe(200)
    const body = await res.json()
    // Documented unauthenticated shape: both null. We do not
    // assert the absence of other fields — Better Auth owns
    // the envelope.
    expect(body).toMatchObject({
      session: null,
      user: null,
    })
  })
})


