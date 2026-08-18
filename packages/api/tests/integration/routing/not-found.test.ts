/**
 * Integration test for the Hono global notFound envelope.
 *
 * Per ADR-016, asserts the wire shape that
 * `packages/api/src/index.ts:33-47` returns for any URL Hono
 * does not match. The envelope is shaped to be parsable by
 * `@orpc/client` as a defined-false ORPCError, so a change to
 * the field set is a breaking change for both the typed client
 * and the apps/web fetch hook.
 *
 * This is the load-bearing assertion that would have caught
 * the ADR-015 regression: with the Hono `/rpc/*` pattern
 * matching one segment, a POST to `/api/v1/rpc/templates/list`
 * returns exactly this envelope with a 404 status.
 */
import { describe, expect, it } from "vitest"

import { api } from "../../src/index.js"

describe("notFound envelope", () => {
  it("returns 404 with the standard envelope for unknown URLs", async () => {
    const res = await api.request("/api/v1/does-not-exist")
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toMatchObject({
      defined: false,
      code: "NOT_FOUND",
      message: expect.any(String),
    })
    // requestId is set by the request-id middleware. The notFound
    // handler echoes it into the body so the error can be traced
    // back to a server log line.
    expect(typeof body.requestId).toBe("string")
  })

  it("returns 404 with the same envelope for POST to a non-route URL", async () => {
    const res = await api.request("/api/v1/does-not-exist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toMatchObject({
      defined: false,
      code: "NOT_FOUND",
    })
  })
})
