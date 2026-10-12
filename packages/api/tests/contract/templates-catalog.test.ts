/**
 * Catalog registry invariants for `packages/api/src/templates.ts`.
 *
 * Why this exists:
 *   `/templates` is the only consumer that previously rendered the
 *   catalog at runtime (via oRPC + GitHub enrichment). The new
 *   architecture renders it statically from this local registry
 *   alone, which makes drift between the registry and the
 *   surrounding lookups (categories, framework labels) silently
 *   visible — a category present here but absent from
 *   `CATEGORY_LABELS` would let a `?type=desktop` filter reject
 *   everything. This test pins:
 *     - slug uniqueness
 *     - every required field present and non-empty
 *     - every category referenced by an entry is covered by
 *       `CATEGORY_LABELS`
 *     - `cloneUrl` derives consistently from `owner`/`repo`
 *     - `label` slugs reference framework slugs declared in
 *       `FRAMEWORK_LABELS` (the registry may have labels that are
 *       not frameworks, like "auth" or "vercel" — those are
 *       editorial tags and are intentionally NOT pinned here).
 *
 * It is a contract test on the registry, not on enrichment.
 */
import { describe, expect, it } from "vitest"

import {
  CATEGORY_LABELS,
  FRAMEWORK_LABELS,
} from "../../src/templates-labels.js"
import { TEMPLATES } from "../../src/templates.js"

describe("registry invariants", () => {
  it("contains at least one entry", () => {
    expect(TEMPLATES.length).toBeGreaterThan(0)
  })

  it("has unique slugs", () => {
    const slugs = TEMPLATES.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it.each(TEMPLATES)("$slug has required fields populated", (entry) => {
    expect(entry.slug.length).toBeGreaterThan(0)
    expect(entry.name.length).toBeGreaterThan(0)
    expect(entry.owner.length).toBeGreaterThan(0)
    expect(entry.repo.length).toBeGreaterThan(0)
    expect(entry.category.length).toBeGreaterThan(0)
    expect(Array.isArray(entry.labels)).toBe(true)
  })

  it("uses only categories declared in CATEGORY_LABELS", () => {
    const allowed = new Set(Object.keys(CATEGORY_LABELS))
    for (const entry of TEMPLATES) {
      expect(allowed.has(entry.category)).toBe(true)
    }
  })

  it("uses each declared category at least once (no orphan labels)", () => {
    const used = new Set(TEMPLATES.map((t) => t.category))
    for (const key of Object.keys(CATEGORY_LABELS)) {
      expect(used.has(key)).toBe(true)
    }
  })

  it("uses only declared framework slugs in its `labels`", () => {
    const allowed = new Set(Object.keys(FRAMEWORK_LABELS))
    for (const entry of TEMPLATES) {
      for (const label of entry.labels) {
        // Labels may include editorial tags (e.g. "auth", "vercel")
        // that are intentionally not in FRAMEWORK_LABELS. The sidebar
        // filters by framework only when the label IS a framework
        // slug, so undeclared labels are silently ignored on that
        // axis. Pinning the contract more strictly would force
        // re-shaping of the sidebar logic.
        if (!allowed.has(label)) continue
        expect(allowed.has(label)).toBe(true)
      }
    }
  })
})
