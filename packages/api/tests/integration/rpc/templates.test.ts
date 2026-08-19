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
