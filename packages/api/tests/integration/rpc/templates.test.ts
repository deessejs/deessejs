/**
 * @testClass integration
 * @network github (real)
 * @rateLimitAware true
 *
 * Integration test for the oRPC templates procedure.
 *
 * Per the api CI integration tests, this is the load-bearing test.
 * It exercises the real `api` Hono object via `api.request()`
 * against the URL the `RPCLink` client actually sends:
 * `/api/v1/rpc/templates/list` (two segments after `/rpc/`).
 *
 * The test would have caught the Hono `api.use("/rpc/*", ...)`
 * pattern bug: a pattern that matches one segment cannot route
 * a two-segment procedure path.
 *
 * Per the real-network enrich contract, this test hits the real
 * GitHub REST API through `packages/api/src/core/github/client.ts`.
 * The `enrich()` mock from earlier rounds is gone. The test is
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
import { e2eForceFail } from "../../../src/orpc/routes/templates.js"

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
      // Pin the full registry by slug. Asserting on `length` would
      // force this test to be touched every time a template is
      // added; pinning slugs keeps the test resilient to a
      // growing catalog and still fails loudly if any entry is
      // missing or duplicated.
      expect(templates.map((t) => t.slug).sort()).toEqual([
        "blog-starter",
        "docs-starter",
        "electron-starter",
        "eve-starter",
        "landing-starter",
        "package-starter",
        "saas-starter",
      ])

      const bySlug = new Map(templates.map((t) => [t.slug, t]))
      const template = bySlug.get("saas-starter")
      if (!template) throw new Error("Expected the saas-starter template")
      // Pin the editorial fields from `packages/api/src/templates.ts`.
      // These are the values `enrich()` does not overwrite (or
      // overwrites with the same value).
      expect(template.owner).toBe("deessejs")
      expect(template.repo).toBe("saas-template")
      expect(template.category).toBe("saas")
      // Pin the GitHub-derived fields that are stable across runs.
      expect(template.license).toBe("MIT")
      expect(template.cloneUrl).toBe(
        "https://github.com/deessejs/saas-template"
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
  }

  // The routing contract, and it does not depend on GitHub: the URL
  // Hono serves has to be the URL the RPCLink client sends, whatever
  // the upstream answers. It sits outside the GitHub gate for that
  // reason, so it runs in every environment.
  it("routes the two-segment URL through the oRPC handler, not the notFound fallback", async () => {
    // The assertion that matters for the Hono mount: the URL Hono
    // serves matches the URL the RPCLink client sends. A
    // regression that narrows the Hono mount to one segment
    // surfaces here as a 404 with the notFound envelope.
    //
    // The call goes through the e2e guard, which answers without
    // reaching GitHub. The procedure enriches the whole catalog on
    // every call, fourteen requests to GitHub, and the anonymous
    // rate limit is small enough that paying it twice is what
    // pushes this suite past it. The first test above already
    // covers the real network behind the mount.
    const secret = "test-only-bypass-secret"
    const saved = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = secret
    try {
      const res = await api.request("/api/v1/rpc/templates/list", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-vercel-protection-bypass": secret,
          "x-e2e-force-fail": "1",
        },
        body: JSON.stringify({ data: null, path: ["templates", "list"] }),
      })

      const body = await res.json()
      // The oRPC handler answered: its answer is in the oRPC
      // envelope, and the notFound fallback's is not. The
      // fallback answers at the top level with `defined` and
      // `code`, and carries no `json` at all.
      expect(body).toHaveProperty("json")
      expect(body).not.toMatchObject({
        defined: false,
        code: "NOT_FOUND",
      })
      expect(res.status).not.toBe(404)
    } finally {
      if (saved === undefined) {
        delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      } else {
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET = saved
      }
    }
  })

  it("serves the empty catalog when the guard forces it, without reaching the upstream", async () => {
    // The wiring the guard tests above cannot see: the handler
    // consults the guard, and the guard's answer is what reaches the
    // client. The empty catalog is the guard's own, so GitHub was
    // never asked.
    const secret = "test-only-bypass-secret"
    const saved = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = secret
    try {
      const res = await api.request("/api/v1/rpc/templates/list", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-vercel-protection-bypass": secret,
          "x-e2e-force-fail": "2",
        },
        body: JSON.stringify({ data: null, path: ["templates", "list"] }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.json.templates).toEqual([])
    } finally {
      if (saved === undefined) {
        delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      } else {
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET = saved
      }
    }
  })
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

import {
  describe as describeUnit,
  expect as expectUnit,
  it as itUnit,
} from "vitest"

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

  itUnit(
    "does not translate errors itself — translation lives in the handler",
    async () => {
      // The core layer surfaces raw errors. The handler in
      // `packages/api/src/orpc/routes/templates.ts` is the single
      // place the code is promoted to `TEMPLATES_FETCH_FAILED`.
      // A regression here (e.g. someone wraps `enrich()` in a
      // try/catch and throws an ORPCError from the core) would
      // break the layered separation.
      await expectUnit(enrich(brokenRegistry)).rejects.not.toBeInstanceOf(
        ORPCError
      )
    }
  )
})

/**
 * E2E test guard contract.
 *
 * The guard is the seam that lets the Playwright e2e suite drive the
 * failure / empty paths without a real upstream outage. Its decision
 * is a pure function of the request headers, and it is pinned as one.
 *
 * The decision used to be pinned through the handler, with the guard
 * closed in every case. That made each case reach `enrich()`, and
 * `enrich()` asks GitHub for the whole catalog: two requests per
 * template, fourteen in all. Three cases, forty-two requests, spent
 * outside the quota gate that guards the network test, and the answer
 * then depended on the upstream being reachable. The decision does
 * not need a request to be pinned.
 */
describeUnit("templates.list e2e guard", () => {
  const SECRET = "test-only-bypass-secret"

  /**
   * Runs a case with the given environment, and restores it after.
   *
   * A variable that was absent is deleted again, rather than restored
   * as the string "undefined".
   */
  const withEnv = (
    values: Record<string, string | undefined>,
    run: () => void
  ): void => {
    const saved = new Map<string, string | undefined>()
    for (const [key, value] of Object.entries(values)) {
      saved.set(key, process.env[key])
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    try {
      run()
    } finally {
      for (const [key, value] of saved) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    }
  }

  const headersFor = (overrides: Record<string, string> = {}): Headers =>
    new Headers({
      "x-vercel-protection-bypass": SECRET,
      "x-e2e-force-fail": "1",
      ...overrides,
    })

  itUnit(
    "closed by default: a missing secret means the guard is a no-op",
    () => {
      withEnv({ VERCEL_AUTOMATION_BYPASS_SECRET: undefined }, () => {
        expect(e2eForceFail(headersFor())).toBeNull()
      })
    }
  )

  itUnit(
    "production-impervious: the guard is a no-op when NODE_ENV is 'production'",
    () => {
      withEnv(
        { VERCEL_AUTOMATION_BYPASS_SECRET: SECRET, NODE_ENV: "production" },
        () => {
          expect(e2eForceFail(headersFor())).toBeNull()
        }
      )
    }
  )

  itUnit(
    "header-mismatch: a non-matching bypass value does not enable the guard",
    () => {
      withEnv(
        { VERCEL_AUTOMATION_BYPASS_SECRET: SECRET, NODE_ENV: "test" },
        () => {
          expect(
            e2eForceFail(
              headersFor({ "x-vercel-protection-bypass": "wrong-secret" })
            )
          ).toBeNull()
        }
      )
    }
  )

  itUnit("fires the failure when the secret matches and it is forced", () => {
    withEnv({ VERCEL_AUTOMATION_BYPASS_SECRET: SECRET }, () => {
      expect(() => e2eForceFail(headersFor())).toThrow(ORPCError)
    })
  })

  itUnit("returns an empty catalog when the empty path is forced", () => {
    withEnv({ VERCEL_AUTOMATION_BYPASS_SECRET: SECRET }, () => {
      expect(e2eForceFail(headersFor({ "x-e2e-force-fail": "2" }))).toEqual({
        templates: [],
      })
    })
  })
})
