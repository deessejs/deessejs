/**
 * Unit tests for the `labels` wire-shape invariant.
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
 * future refactor of the ternaries cannot regress the invariant.
 *
 * The preference order changed when the catalogue started reading the
 * template manifest: the curated labels of the manifest win over the
 * repository topics, because the manifest is the single source of the
 * product fields.
 */
import { describe, expect, it } from "vitest"

import { resolveLabels } from "../../src/core/templates/manifest.js"

describe("resolveLabels", () => {
  it("returns the manifest labels when present and non-empty", () => {
    expect(resolveLabels(["nextjs", "drizzle"], ["repo-topic"])).toEqual([
      "nextjs",
      "drizzle",
    ])
  })

  it("falls back to the repo topics when the manifest declares none", () => {
    expect(resolveLabels(undefined, ["nextjs", "saas"])).toEqual([
      "nextjs",
      "saas",
    ])
  })

  it("falls back to the repo topics when the manifest labels are empty", () => {
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

  it("does not coerce non-array values (defensive against bad upstream)", () => {
    // The `labels` field is typed `string[]` but JSON could
    // theoretically carry anything. We rely on `Array.isArray` as
    // the gate so a malformed payload still resolves to the repo
    // topics rather than crashing the resolver.
    // @ts-expect-error : intentional adversarial input
    expect(resolveLabels("not-an-array", ["nextjs"])).toEqual(["nextjs"])
    // @ts-expect-error : intentional
    expect(resolveLabels(null, ["nextjs"])).toEqual(["nextjs"])
    // @ts-expect-error : intentional
    expect(resolveLabels({ length: 0 }, ["nextjs"])).toEqual(["nextjs"])
  })
})
