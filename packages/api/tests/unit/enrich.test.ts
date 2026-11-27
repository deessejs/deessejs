/**
 * Unit tests for `enrich.ts` wire-shape invariants.
 *
 * Why: production crash at digest `551940582`
 *   TypeError: Cannot read properties of undefined (reading 'length')
 *     at o (.next/server/chunks/ssr/[root-of-the-server]__1xxfhda._.js:1:6744)
 * surfaced when an enriched template reached the wire with
 * `labels: undefined`. The crash site on apps/web was
 * `TemplateLabels` reading `labels.length` directly.
 *
 * The fix centralises the invariant in `resolveLabels`: the field
 * emitted on the wire is ALWAYS a `string[]`, never `undefined`,
 * never `null`, never a non-array. This file pins the resolver so a
 * future refactor of the ternaries in `enrich()` cannot regress
 * the invariant.
 */
import { describe, expect, it } from "vitest"

import { resolveLabels } from "../../src/core/templates/enrich.js"

describe("resolveLabels", () => {
  it("returns repo topics when present and non-empty", () => {
    expect(
      resolveLabels(["drizzle", "postgres"], ["registry-fallback"])
    ).toEqual(["drizzle", "postgres"])
  })

  it("falls back to entry labels when repo topics is undefined", () => {
    expect(resolveLabels(undefined, ["nextjs", "saas"])).toEqual([
      "nextjs",
      "saas",
    ])
  })

  it("falls back to entry labels when repo topics is an empty array", () => {
    expect(resolveLabels([], ["nextjs", "saas"])).toEqual(["nextjs", "saas"])
  })

  it("returns an empty array when both sources are undefined (no crash)", () => {
    // The whole reason this helper exists: a missing field must
    // produce `[]`, never `undefined`. `TemplateLabels` reads
    // `labels.length` directly on the wire payload.
    expect(resolveLabels(undefined, undefined)).toEqual([])
  })

  it("returns an empty array when both sources are empty arrays", () => {
    expect(resolveLabels([], [])).toEqual([])
  })

  it("falls back to entry labels for malformed repo topics", () => {
    expect(resolveLabels("not-an-array", ["nextjs"])).toEqual(["nextjs"])
    expect(resolveLabels(null, ["nextjs"])).toEqual(["nextjs"])
    expect(resolveLabels({ length: 0 }, ["nextjs"])).toEqual(["nextjs"])
    expect(resolveLabels(["valid", 42], ["nextjs"])).toEqual(["nextjs"])
  })

  it("returns an empty array for malformed entry labels", () => {
    expect(resolveLabels(undefined, "not-an-array")).toEqual([])
    expect(resolveLabels(undefined, ["valid", 42])).toEqual([])
  })
})
