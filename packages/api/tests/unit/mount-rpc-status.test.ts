/**
 * mountRpc — HTTP status preservation through the production
 * Hono stack.
 *
 * Why this test exists:
 *   The previous implementation spread an upstream `Response`
 *   into `Hono.Context.newResponse(body, { ...response, headers })`.
 *   `status` and `statusText` are non-enumerable on the Response
 *   prototype chain, so the spread silently dropped them and Hono
 *   fell back to its default 200. An oRPC `ORPCError` translated
 *   to a 502 envelope arrived as HTTP 200, oRPC's client codec
 *   treated it as success, and `apps/web` displayed
 *   "No templates" against the actual upstream failure.
 *
 * Strategy:
 *   This test exercises the *real* `mountRpc` mounted on the
 *   production `api` object (`api.request(...)`). Driving the
 *   real chain — including every middleware Hono runs through
 *   in production — is the only way to assert status preservation
 *   without re-implementing the bug. We use the same e2e guard
 *   header that Playwright uses to force the failure path. A
 *   mocked `enrich()` keeps the test network-independent.
 *
 *   The negative test reproduces the buggy spread form in an
 *   isolated Hono app and confirms it collapses to 200 — the
 *   load-bearing assertion is the symmetric positive test.
 */
import { Hono } from "hono"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { api } from "../../src/index.js"
import type { ApiEnv } from "../../src/http/env.js"

// Mock enrich so the happy-path test is network-independent.
vi.mock("../../src/core/templates/index.js", () => ({
  enrich: async (entries: ReadonlyArray<unknown>) => entries,
}))

const TEMPLATES_URL = "/api/v1/rpc/templates/list"
const TEMPLATES_BODY = JSON.stringify({
  data: null,
  path: ["templates", "list"],
})

describe("mountRpc — end-to-end status preservation via the production api", () => {
  it("preserves an upstream 502 from the templates procedure", async () => {
    const savedSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    const savedNodeEnv = process.env.NODE_ENV
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = "test-only-bypass-secret"
    process.env.NODE_ENV = "test"
    try {
      const res = await api.request(TEMPLATES_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-vercel-protection-bypass": "test-only-bypass-secret",
          "x-e2e-force-fail": "1",
        },
        body: TEMPLATES_BODY,
      })
      // The whole reason this test exists: an upstream 502 must
      // arrive as 502 end-to-end, not collapse to 200.
      expect(res.status).toBe(502)
      expect(res.headers.get("cache-control")).toBe("no-store")
    } finally {
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET = savedSecret
      process.env.NODE_ENV = savedNodeEnv
    }
  })

  it("preserves an upstream 200 from the templates procedure", async () => {
    const savedSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    try {
      const res = await api.request(TEMPLATES_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: TEMPLATES_BODY,
      })
      expect(res.status).toBe(200)
      expect(res.headers.get("cache-control")).toBe("no-store")
    } finally {
      if (savedSecret !== undefined) {
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET = savedSecret
      }
    }
  })
})

/**
 * Negative test: documents the regression mode. The buggy spread
 * `{ ...response }` collapses status to 200. We reproduce that
 * shape in isolation and confirm. The positive test above
 * passing today is the load-bearing assertion.
 */
describe("mountRpc — old spread regression mode", () => {
  const buildBuggyApp = (): Hono<ApiEnv> => {
    const app = new Hono<ApiEnv>()
    app.use("/rpc/*", async (c) => {
      const response = new Response(
        JSON.stringify({ error: "FORCED", data: null }),
        { status: 502, statusText: "Bad Gateway" },
      )
      const headers = new Headers(response.headers)
      return c.newResponse(response.body, { ...response, headers })
    })
    return app
  }

  beforeAll(() => {})
  afterAll(() => {})

  it("under the old shape Hono + spread returns 200 for an upstream 502", async () => {
    const app = buildBuggyApp()
    const res = await app.request("/rpc/probe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: null, path: ["probe"] }),
    })
    expect(res.status).not.toBe(502)
  })
})
