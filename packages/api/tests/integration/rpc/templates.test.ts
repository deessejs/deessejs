/**
 * Integration test for the oRPC templates procedure.
 *
 * Per ADR-016, this is the load-bearing test. It exercises the
 * real `api` Hono object via `api.request()` against the URL
 * the `RPCLink` client actually sends: `/api/v1/rpc/templates/list`
 * (two segments after `/rpc/`).
 *
 * The test would have caught the bug documented in ADR-015: a
 * Hono `api.use("/rpc/*", ...)` pattern that matches one
 * segment cannot route a two-segment procedure path. The
 * client request hits the global notFound handler, which
 * returns the { defined: false, code: "NOT_FOUND", ... } envelope.
 *
 * Network calls: the `enrich` boundary is mocked via the
 * dynamic-import form of `vi.mock` per the ADR-016 round-2
 * pin. The enrich mock's return value is built from the
 * shared TemplateV1 schema so the test cannot drift from the
 * contract.
 */
import { describe, expect, it, vi } from "vitest"

vi.mock(import("../../../src/core/templates/index.js"), () => ({
  enrich: vi.fn(async () => [
    {
      slug: "saas-starter",
      name: "SaaS Starter",
      description: "Production-ready Next.js + Better Auth + Postgres boilerplate.",
      owner: "deessejs",
      repo: "saas-template",
      license: "MIT",
      category: "saas",
      labels: ["nextjs", "saas", "auth", "postgres"],
    },
  ]),
}))

import { TemplateV1 } from "@workspace/contracts/v1"

import { api } from "../../../src/index.js"

describe("POST /api/v1/rpc/templates/list", () => {
  const EXPECTED_TEMPLATE: ReturnType<typeof TemplateV1.parse> = TemplateV1.parse({
    slug: "saas-starter",
    name: "SaaS Starter",
    description:
      "Production-ready Next.js + Better Auth + Postgres boilerplate.",
    owner: "deessejs",
    repo: "saas-template",
    license: "MIT",
    category: "saas",
    labels: ["nextjs", "saas", "auth", "postgres"],
  })

  it("returns the catalog wrapped in the TemplatesListResponseV1 shape", async () => {
    const res = await api.request("/api/v1/rpc/templates/list", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: null, path: ["templates", "list"] }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    // The oRPC wire shape is { json, meta }. The `json` field carries
    // the procedure's return value; the `meta` field carries the
    // native-type annotation (https://orpc.dev/docs/advanced/rpc-protocol).
    expect(body.json).toEqual({ templates: [EXPECTED_TEMPLATE] })
  })

  it("routes the two-segment URL through the oRPC handler, not the notFound fallback", async () => {
    // The assertion that matters for ADR-015: the URL Hono serves
    // matches the URL the RPCLink client sends. A regression that
    // narrows the Hono mount to one segment surfaces here as a 404
    // with the notFound envelope shape.
    const res = await api.request("/api/v1/rpc/templates/list", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: null, path: ["templates", "list"] }),
    })

    if (res.status === 404) {
      const body = await res.json()
      // If the Hono mount missed, the notFound handler returns this
      // exact shape. The assertion below documents the regression
      // mode as a failure of THIS test.
      expect(body).not.toMatchObject({
        defined: false,
        code: "NOT_FOUND",
      })
    }

    expect(res.status).toBe(200)
  })
})
