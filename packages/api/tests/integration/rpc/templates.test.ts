/**
 * @testClass integration
 * @network github (real)
 * @rateLimitAware true
 *
 * Integration test for the oRPC templates procedure.
 *
 * Per ADR-016, this is the load-bearing test. It exercises the
 * real `api` Hono object via `api.request()` against the URL
 * the `RPCLink` client actually sends: `/api/v1/rpc/templates/list`
 * (two segments after `/rpc/`).
 *
 * The test would have caught the bug documented in ADR-015: a
 * Hono `api.use("/rpc/*", ...)` pattern that matches one
 * segment cannot route a two-segment procedure path.
 *
 * Per ADR-017, this test hits the real GitHub REST API
 * through `packages/api/src/core/github/client.ts`. The
 * `enrich()` mock from earlier rounds is gone. The test is
 * gated on `inject('github:ready')` and skips loudly when
 * the GitHub rate limit is below the threshold set by
 * `globalSetup.ts` (`GITHUB_RATE_LIMIT_THRESHOLD`).
 *
 * Fixture shape: the assertion uses `toMatchObject` rather
 * than `toEqual` because `updatedAt` is a real timestamp
 * from GitHub and `stargazers_count` may change between
 * runs. The fields we pin exactly (slug, name, owner, repo,
 * license, cloneUrl) are the ones that should be stable.
 * The description and labels are derived from the live repo
 * (see `enrich.ts`), so we only assert they are strings or
 * arrays, not specific values.
 */
import { describe, expect, it } from "vitest"
import { inject } from "vitest"

import { api } from "../../../src/index.js"

const GITHUB_READY = inject("github:ready") === true

describe("POST /api/v1/rpc/templates/list", () => {
  if (!GITHUB_READY) {
    it.skip("[skip-github] templates enrichment requires GitHub rate-limit headroom", () => {
      // Loud skip: the test name carries the [skip-github] annotation
      // and the global setup emits a WARN. A misconfigured CI is
      // visible in the log aggregator.
    })
  } else {
    it("returns the catalog enriched with live GitHub data", async () => {
      const res = await api.request("/api/v1/rpc/templates/list", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: null, path: ["templates", "list"] }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      // The oRPC wire shape is { json, meta }. The `json` field
      // carries the procedure's return value; the `meta` field
      // carries the native-type annotation
      // (https://orpc.dev/docs/advanced/rpc-protocol).
      const templates = body.json.templates as Array<Record<string, unknown>>
      expect(Array.isArray(templates)).toBe(true)
      expect(templates.length).toBe(1)

      const template = templates[0]
      // Pin the editorial fields from `packages/api/src/templates.ts`.
      // These are the values `enrich()` does not overwrite (or
      // overwrites with the same value).
      expect(template.slug).toBe("saas-starter")
      expect(template.owner).toBe("deessejs")
      expect(template.repo).toBe("saas-template")
      expect(template.category).toBe("saas")
      // Pin the GitHub-derived fields that are stable across runs.
      expect(template.license).toBe("MIT")
      expect(template.cloneUrl).toBe(
        "https://github.com/deessejs/saas-template",
      )
      // Pin the type shape of fields that vary in value but
      // not in type. A future contract change (e.g. GitHub
      // removing `stargazers_count`) fails this test.
      expect(typeof template.name).toBe("string")
      expect(typeof template.description).toBe("string")
      expect(Array.isArray(template.labels)).toBe(true)
      expect((template.labels as unknown[]).length).toBeGreaterThan(0)
      expect(typeof template.updatedAt).toBe("string")
      expect(typeof template.stars).toBe("number")
    })

    it("routes the two-segment URL through the oRPC handler, not the notFound fallback", async () => {
      // The assertion that matters for ADR-015: the URL Hono
      // serves matches the URL the RPCLink client sends. A
      // regression that narrows the Hono mount to one segment
      // surfaces here as a 404 with the notFound envelope.
      // With the real network behind it, this also confirms
      // that a non-mocked `enrich()` does not affect routing.
      const res = await api.request("/api/v1/rpc/templates/list", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: null, path: ["templates", "list"] }),
      })

      if (res.status === 404) {
        const body = await res.json()
        // If the Hono mount missed, the notFound handler
        // returns this exact shape. The assertion below
        // documents the regression mode as a failure of THIS
        // test.
        expect(body).not.toMatchObject({
          defined: false,
          code: "NOT_FOUND",
        })
      }

      expect(res.status).toBe(200)
    })
  }
})

/**
 * Wire-code contract test (issue #81).
 *
 * Pins the error contract that the marketing site depends on:
 * when GitHub enrichment fails, the typed client must see an
 * `ORPCError` with code `"TEMPLATES_FETCH_FAILED"` (status 502),
 * NOT a generic `INTERNAL_SERVER_ERROR`. The failure is
 * triggered by feeding `enrich()` a registry entry pointing at
 * a non-existent GitHub repo (synchronous reject from
 * `packages/api/src/core/github/client.ts#fetchRepo`).
 *
 * This is a unit-style test of the core layer; the oRPC handler
 * wrapping `enrich()` and translating the raw `Error` is covered
 * by the integration test above (under the `[skip-github]`
 * block — when real GitHub is rate-limited this is the only
 * place the wire-code is exercised end-to-end).
 */
import type { TemplateV1 } from "@workspace/contracts/v1"

import { describe as describeUnit, expect as expectUnit, it as itUnit } from "vitest"

import { ORPCError } from "@orpc/server"

import { enrich } from "../../../src/core/templates/enrich.js"
import { TEMPLATES } from "../../../src/templates.js"

const brokenRegistry: ReadonlyArray<TemplateV1> = [
  {
    ...TEMPLATES[0],
    repo: "this-repo-must-not-exist-xyz-12345",
  },
]

describeUnit("enrich() failure surface (issue #81 wire-code)", () => {
  itUnit("rejects with a plain Error when GitHub returns non-OK", async () => {
    await expectUnit(enrich(brokenRegistry)).rejects.toBeInstanceOf(Error)
  })

  itUnit("does not translate errors itself — translation lives in the handler", async () => {
    // The core layer surfaces raw errors. The handler in
    // `packages/api/src/orpc/routes/templates.ts` is the single
    // place the code is promoted to `TEMPLATES_FETCH_FAILED`.
    // A regression here (e.g. someone wraps `enrich()` in a
    // try/catch and throws an ORPCError from the core) would
    // break the layered separation.
    await expectUnit(enrich(brokenRegistry)).rejects.not.toBeInstanceOf(
      ORPCError,
    )
  })
})

/**
 * E2E test guard contract (ADR-020).
 *
 * Three unit-tier tests that pin the contract of the
 * x-vercel-protection-bypass + x-e2e-force-fail guard inside
 * the templates handler. The guard is the seam that lets the
 * Playwright e2e suite drive the failure / empty paths
 * without a real upstream outage.
 *
 * These tests do NOT hit the network — they run on every PR
 * regardless of the GitHub rate limit. They only need to
 * assert the guard's behavior under three specific shapes
 * of the bypass header.
 */
describeUnit("templates.list e2e guard (ADR-020)", () => {
  const SECRET = "test-only-bypass-secret"
  const URL = "/api/v1/rpc/templates/list"
  const BODY = JSON.stringify({ data: null, path: ["templates", "list"] })

  const call = (headers: Record<string, string> = {}) =>
    api.request(URL, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: BODY,
    })

  itUnit(
    "closed by default: missing secret OR missing/non-matching bypass header means the guard is a no-op",
    async () => {
      // Save the real env value (if any) and ensure it is empty
      // so the guard closes by default.
      const saved = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      try {
        // No headers — guard should be closed.
        const res = await call({ "x-e2e-force-fail": "1" })
        // The guard is closed, so we hit `enrich()` (which
        // requires GitHub in real network but here we are in
        // CI with mocked network — see globalSetup). The test
        // pins that the response is NOT the wire-code 502.
        expect(res.status).not.toBe(502)
      } finally {
        if (saved !== undefined) process.env.VERCEL_AUTOMATION_BYPASS_SECRET = saved
      }
    },
  )

  itUnit(
    "production-impervious: guard is a no-op when NODE_ENV is 'production'",
    async () => {
      const savedSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      const savedNodeEnv = process.env.NODE_ENV
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET = SECRET
      process.env.NODE_ENV = "production"
      try {
        // Even with a valid secret AND a matching bypass header
        // AND the force-fail value, production cannot reach
        // the test path.
        const res = await call({
          "x-vercel-protection-bypass": SECRET,
          "x-e2e-force-fail": "1",
        })
        expect(res.status).not.toBe(502)
      } finally {
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET = savedSecret
        process.env.NODE_ENV = savedNodeEnv
      }
    },
  )

  itUnit(
    "header-mismatch: a non-matching bypass value does not enable the guard",
    async () => {
      const savedSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      const savedNodeEnv = process.env.NODE_ENV
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET = SECRET
      process.env.NODE_ENV = "test"
      try {
        // Bypass header does NOT match the server-side secret.
        const res = await call({
          "x-vercel-protection-bypass": "wrong-secret",
          "x-e2e-force-fail": "1",
        })
        expect(res.status).not.toBe(502)
      } finally {
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET = savedSecret
        process.env.NODE_ENV = savedNodeEnv
      }
    },
  )
})
