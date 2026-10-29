/**
 * @testClass integration
 * @database postgres
 *
 * Integration tests for the public templates procedures. Catalog reads use
 * the database; they no longer depend on live GitHub requests.
 */
import { describe, expect, it, inject } from "vitest"

import { api } from "../../../src/index.js"
import { e2eForceFail } from "../../../src/orpc/routes/templates.js"

const POSTGRES_READY = inject("postgres:ready") === true

describe("POST /api/v1/rpc/templates/list", () => {
  if (!POSTGRES_READY) {
    it.skip("[skip-postgres] templates catalog reads require Postgres", () => {})
  } else {
    it("returns the database catalog in the public V1 shape", async () => {
      const res = await api.request("/api/v1/rpc/templates/list", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: null, path: ["templates", "list"] }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      const templates = body.json.templates as Array<Record<string, unknown>>
      expect(Array.isArray(templates)).toBe(true)
      for (const template of templates) {
        expect(typeof template.slug).toBe("string")
        expect(typeof template.name).toBe("string")
        expect(typeof template.description).toBe("string")
        expect(typeof template.owner).toBe("string")
        expect(typeof template.repo).toBe("string")
        expect(typeof template.license).toBe("string")
        expect(typeof template.category).toBe("string")
        expect(Array.isArray(template.labels)).toBe(true)
      }
    })
  }

  it("routes the two-segment URL through the oRPC handler", async () => {
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
      expect(body).toHaveProperty("json")
      expect(body).not.toMatchObject({ defined: false, code: "NOT_FOUND" })
      expect(res.status).not.toBe(404)
    } finally {
      if (saved === undefined) {
        delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      } else {
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET = saved
      }
    }
  })

  it("serves an empty catalog when the e2e guard forces it", async () => {
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

describe("templates.list e2e guard", () => {
  const SECRET = "test-only-bypass-secret"
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

  it("is closed by default without the configured secret", () => {
    withEnv({ VERCEL_AUTOMATION_BYPASS_SECRET: undefined }, () => {
      expect(e2eForceFail(headersFor())).toBeNull()
    })
  })

  it("is disabled in production", () => {
    withEnv(
      { VERCEL_AUTOMATION_BYPASS_SECRET: SECRET, NODE_ENV: "production" },
      () => expect(e2eForceFail(headersFor())).toBeNull()
    )
  })

  it("ignores a mismatched bypass header", () => {
    withEnv(
      { VERCEL_AUTOMATION_BYPASS_SECRET: SECRET, NODE_ENV: "test" },
      () =>
        expect(
          e2eForceFail(
            headersFor({ "x-vercel-protection-bypass": "wrong-secret" })
          )
        ).toBeNull()
    )
  })

  it("forces the failure when the secret matches", () => {
    withEnv({ VERCEL_AUTOMATION_BYPASS_SECRET: SECRET }, () => {
      expect(() => e2eForceFail(headersFor())).toThrow()
    })
  })

  it("forces an empty catalog when requested", () => {
    withEnv({ VERCEL_AUTOMATION_BYPASS_SECRET: SECRET }, () => {
      expect(e2eForceFail(headersFor({ "x-e2e-force-fail": "2" }))).toEqual({
        templates: [],
      })
    })
  })
})
