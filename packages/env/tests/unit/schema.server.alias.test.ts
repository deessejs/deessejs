/**
 * Locks the contract that the server schema's `.superRefine` accepts
 * either `BETTER_AUTH_SECRET` or `AUTH_SECRET` as a 32+ char secret in
 * `NODE_ENV=production`, and rejects when neither is present.
 *
 * Why this test exists (ADR-011, rank 2):
 *
 *   PR #49 (commit 47789b9) had to fix a regression where the
 *   alias resolution used `z.preprocess` per-field. Zod 4 passes
 *   each field's value to a per-field preprocess, not the parent
 *   object, so `z.preprocess` on `BETTER_AUTH_SECRET` could never
 *   see `process.env.AUTH_SECRET`. The alias silently lost every
 *   match. CI `Validate env` caught the symptom; this test catches
 *   the root cause at parse time.
 *
 * The fix moved the resolution out of the schema (where Zod's
 * per-field parsing semantics preclude it) and into the consumer
 * (server.ts) plus the validation gate (this script). The
 * `.superRefine` accepts either name as the secret; resolution
 * lands the canonical value in the runtime object.
 *
 * Five cases (matches ADR-011 rank 2 spec):
 *
 *   1. `BETTER_AUTH_SECRET` set alone, ≥ 32 chars → success
 *   2. `AUTH_SECRET` set alone, ≥ 32 chars → success (alias works)
 *   3. Both set → success (canonical is preferred by `.superRefine`)
 *   4. Neither set, NODE_ENV=production → fail at path
 *      `["BETTER_AUTH_SECRET"]`
 *   5. Neither set, NODE_ENV=development → success (dev gate is
 *      permissive)
 */

import { describe, expect, it } from "vitest"

import { serverSchema } from "../../src/schema.js"

const VALID_SECRET =
  "ci-test-secret-which-is-long-enough-to-pass-the-32-char-validation"

const BASE = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
} as const

describe("serverSchema.superRefine — AUTH_SECRET / BETTER_AUTH_SECRET alias", () => {
  it("accepts BETTER_AUTH_SECRET alone in production", () => {
    const result = serverSchema.safeParse({
      ...BASE,
      NODE_ENV: "production",
      BETTER_AUTH_SECRET: VALID_SECRET,
    })
    expect(result.success).toBe(true)
  })

  it("accepts AUTH_SECRET alone in production (alias)", () => {
    // This case is the regression signal. Before commit 47789b9,
    // the schema's `z.preprocess` only saw the field's own value
    // (a string), never the parent's AUTH_SECRET, so the alias
    // could not resolve.
    const result = serverSchema.safeParse({
      ...BASE,
      NODE_ENV: "production",
      AUTH_SECRET: VALID_SECRET,
    })
    expect(result.success).toBe(true)
  })

  it("accepts both, no conflict", () => {
    const result = serverSchema.safeParse({
      ...BASE,
      NODE_ENV: "production",
      BETTER_AUTH_SECRET: VALID_SECRET,
      AUTH_SECRET: VALID_SECRET,
    })
    expect(result.success).toBe(true)
  })

  it("rejects with neither in production, error paths to BETTER_AUTH_SECRET", () => {
    // The gate's `path` is on the canonical name even when neither
    // is set. This makes the error message in scripts/env-check.ts
    // and vitest fail output predictable: the canonical field is
    // the one that holds the invariant.
    const result = serverSchema.safeParse({
      ...BASE,
      NODE_ENV: "production",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const authIssue = result.error.issues.find(
        (issue) => issue.path[0] === "BETTER_AUTH_SECRET"
      )
      expect(authIssue).toBeDefined()
      expect(authIssue?.message).toMatch(/(BETTER_AUTH_SECRET|AUTH_SECRET)/)
    }
  })

  it("accepts with neither in development (dev gate is permissive)", () => {
    const result = serverSchema.safeParse({
      ...BASE,
      NODE_ENV: "development",
    })
    expect(result.success).toBe(true)
  })
})
