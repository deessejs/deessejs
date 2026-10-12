/**
 * E2E test guard contract (ADR-020).
 *
 * Why this file lives apart from `templates.test.ts`:
 *   The guard tests need a deterministic `enrich()` to assert on
 *   the response body shape. Vitest hoists `vi.mock` calls to the
 *   top of the file, so a file-level mock in `templates.test.ts`
 *   would silently apply to the live GitHub enrichment test
 *   sitting next to it. That used to be the case: the live test
 *   was passing the registry entries through unchanged and
 *   collapsing on `template.cloneUrl` (undefined on the raw
 *   registry). Moving the guard tests to a separate file gives
 *   them their own `vi.mock` scope and lets the live test see
 *   the real `enrich()`.
 *
 * What the four tests pin:
 *   - `closed by default` — guard is a no-op without the secret.
 *   - `production-impervious` — guard cannot fire in production
 *     regardless of the bypass secret.
 *   - `header-mismatch` — a non-matching bypass header is the
 *     same as no header.
 *   - `guard fires` (positive control) — when both the secret
 *     and the header match, the response is 502 with the
 *     `TEMPLATES_FETCH_FAILED` envelope, and the happy path is
 *     unreachable.
 *
 * None of these tests hit the network. The mock is the seam
 * that removes the GitHub axis from the guard contract.
 */
import { describe, expect, it, vi } from "vitest"

import { api } from "../../../src/index.js"

// Mock `enrich()` so the guard contract is exercised against an
// honest success path. Hoisted by Vitest above all imports, so
// it only affects THIS file.
vi.mock("../../../src/core/templates/index.js", () => ({
  enrich: async (entries: ReadonlyArray<unknown>) => entries,
}))

const SECRET = "test-only-bypass-secret"
const URL = "/api/v1/rpc/templates/list"
const BODY = JSON.stringify({ data: null, path: ["templates", "list"] })

const call = (headers: Record<string, string> = {}) =>
  api.request(URL, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: BODY,
  })

/**
 * The guard's whole reason to exist is to short-circuit the
 * response shape before any upstream call. When the guard is
 * closed, we must reach a "happy path" success body (the
 * mocked `enrich()` returning the registry). When the guard
 * fires, the body carries an oRPC error envelope at `body.json`
 * with `code: "TEMPLATES_FETCH_FAILED"` and `defined: false`.
 *
 * Returns true only for the happy path. Both 200-with-templates
 * and the (unused) `{ templates: [] }` happy path qualify.
 */
const isHappyPathBody = async (res: Response) => {
  const body = (await res.json()) as {
    json?: { templates?: unknown[]; code?: string }
  }
  // oRPC error envelopes nest the error JSON inside `body.json`
  // with a `code` field when `defined: false`. A happy path
  // body never has a `code` field at that location.
  if (typeof body.json?.code === "string") return false
  return Array.isArray(body.json?.templates)
}

describe("templates.list e2e guard (ADR-020)", () => {
  it("closed by default: missing secret OR missing/non-matching bypass header means the guard is a no-op", async () => {
    // Save the real env value (if any) and ensure it is empty
    // so the guard closes by default.
    const saved = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    try {
      // No headers — guard should be closed.
      const res = await call({ "x-e2e-force-fail": "1" })
      // The guard is closed; we expect the happy-path body
      // (the mocked enrich returns the registry unchanged).
      // This is the strongest pin now that 502 is honest.
      expect(await isHappyPathBody(res)).toBe(true)
    } finally {
      if (saved !== undefined) {
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET = saved
      }
    }
  })

  it("production-impervious: guard is a no-op when NODE_ENV is 'production'", async () => {
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
      expect(await isHappyPathBody(res)).toBe(true)
    } finally {
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET = savedSecret
      process.env.NODE_ENV = savedNodeEnv
    }
  })

  it("header-mismatch: a non-matching bypass value does not enable the guard", async () => {
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
      expect(await isHappyPathBody(res)).toBe(true)
    } finally {
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET = savedSecret
      process.env.NODE_ENV = savedNodeEnv
    }
  })

  /**
   * Positive control: when the guard IS enabled, the response
   * carries the `TEMPLATES_FETCH_FAILED` wire-code and the
   * happy path is unreachable. This pins that the mock does
   * not accidentally cover the failure paths too.
   */
  it("guard fires when bypass secret matches and force-fail is set", async () => {
    const savedSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    const savedNodeEnv = process.env.NODE_ENV
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = SECRET
    process.env.NODE_ENV = "test"
    try {
      const res = await call({
        "x-vercel-protection-bypass": SECRET,
        "x-e2e-force-fail": "1",
      })
      // Status preserved end-to-end: 502 from the oRPC handler
      // arrives as 502, exactly the contract the previous spread
      // bug broke.
      expect(res.status).toBe(502)
      const body = (await res.json()) as {
        json?: { code?: string; defined?: boolean }
      }
      expect(body.json?.code).toBe("TEMPLATES_FETCH_FAILED")
      expect(body.json?.defined).toBe(false)
    } finally {
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET = savedSecret
      process.env.NODE_ENV = savedNodeEnv
    }
  })
})
