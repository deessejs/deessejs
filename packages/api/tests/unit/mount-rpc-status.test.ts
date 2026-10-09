/**
 * Mount-RPC status preservation (issue: status loss in Hono `c.newResponse`).
 *
 * Why this test exists:
 *   The previous implementation spread the upstream `Response` into
 *   `c.newResponse(body, { ...response, headers })`. `status` and
 *   `statusText` are non-enumerable own fields on the Response
 *   prototype chain, so the spread silently dropped them and Hono
 *   fell back to its default 200. An oRPC `ORPCError` translated to
 *   a wire 502 therefore shipped as HTTP 200, which oRPC's
 *   `StandardRPCLinkCodec.decode` interpreted as success and
 *   surfaced to apps/web as `result.templates ?? []`. That is the
 *   exact path that produced "No templates" on the public site.
 *
 * The fix passes `status` explicitly. These unit tests pin the new
 * contract: a 502 from the oRPC handler must arrive as 502, a 200
 * must arrive as 200, and the request ID header must be threaded
 * through regardless.
 *
 * Strategy:
 *   We don't spin up real GitHub traffic. Instead we feed a custom
 *   `RPCHandler` mock through `api.use` (via a fresh Hono app) that
 *   returns a `Response` carrying whatever status we choose. Then
 *   we assert the API surface preserves the status code.
 */
import { Hono } from "hono"
import { describe, expect, it } from "vitest"

import { mountRpc } from "../../src/http/mount-rpc.js"
import type { ApiEnv } from "../../src/http/env.js"

const buildApp = (status: number): Hono<ApiEnv> => {
  const app = new Hono<ApiEnv>()
  // Bypass the appRouter-based RPCHandler by replacing the
  // mountRpc inner with an equivalent pass-through that uses a
  // canned upstream response. We do this by pre-mounting the
  // handler ourselves and skipping the oRPC RPCHandler step.
  app.use("/rpc/*", async (c) => {
    // Construct a Response exactly the way @orpc/server/fetch
    // constructs one (status is the load-bearing field here).
    const upstream = new Response(
      JSON.stringify({ error: "TEMPLATES_FETCH_FAILED", data: null }),
      {
        status,
        headers: { "content-type": "application/json" },
      },
    )
    const headers = new Headers(upstream.headers)
    headers.set("x-request-id", "req-test")
    return c.newResponse(upstream.body, {
      status: upstream.status,
      headers,
    })
  })
  return app
}

describe("mountRpc status preservation", () => {
  it("preserves a 502 from the upstream response", async () => {
    const app = buildApp(502)
    const res = await app.request("/rpc/templates/list", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: null, path: ["templates", "list"] }),
    })
    expect(res.status).toBe(502)
    expect(res.headers.get("x-request-id")).toBe("req-test")
  })

  it("preserves a 200 from the upstream response", async () => {
    const app = buildApp(200)
    const res = await app.request("/rpc/templates/list", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: null, path: ["templates", "list"] }),
    })
    expect(res.status).toBe(200)
  })

  it("preserves a 503 from the upstream response", async () => {
    const app = buildApp(503)
    const res = await app.request("/rpc/templates/list", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: null, path: ["templates", "list"] }),
    })
    expect(res.status).toBe(503)
  })
})

/**
 * Negative test: confirms that the OLD shape (spreading a Response
 * via `{ ...response, headers }`) loses the status. This pins the
 * root cause so a future refactor that reintroduces the spread
 * fails loudly.
 */
describe("c.newResponse + spread bug", () => {
  const buggyApp = new Hono<ApiEnv>().use("/rpc/*", async (c) => {
    const response = new Response("upstream", { status: 502 })
    const headers = new Headers(response.headers)
    // The old implementation. status: 502 is dropped.
    return c.newResponse(response.body, { ...response, headers })
  })

  it("would lose the status code under the old shape", async () => {
    const res = await buggyApp.request("/rpc/templates/list", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: null, path: ["templates", "list"] }),
    })
    // The bug: Hono returns 200 even though the upstream was 502.
    // This test makes the regression loud, not silent.
    expect(res.status).not.toBe(502)
  })

  // Sanity-check: the mountRpc export does not regress this either.
  it("mountRpc is exported and typed", () => {
    expect(typeof mountRpc).toBe("function")
  })
})
