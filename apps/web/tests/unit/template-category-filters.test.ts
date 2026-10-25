/**
 * The `/templates` type filter.
 *
 * The acceptance criterion for the catalogue is that every category
 * filter returns its matching rows. This is the test that would have
 * caught the drift where the label map held three categories while the
 * catalog used seven: six of the seven templates sat behind a filter
 * that could not be selected.
 *
 * The fixture is deliberately local. The catalog itself lives in
 * `@workspace/api`, whose root export pulls in the server, so importing
 * it here would drag `postgres` into the browser-side test bundle. The
 * map-to-catalog contract is pinned in `packages/api` instead, in
 * `packages/api/tests/unit/category-maps.test.ts`.
 */
import { describe, expect, it } from "vitest"

import type { TemplateV1 } from "@workspace/contracts/v1"
import { CATEGORY_LABELS } from "@workspace/api/templates-labels"
import {
  filterTemplates,
  resolveTemplateFilter,
} from "../../src/lib/template-filters.js"

/** One template per category the map declares, all on the same framework. */
const FIXTURE: TemplateV1[] = (
  Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]
).map((category) => ({
  slug: `${category}-starter`,
  name: `${category} starter`,
  description: "",
  owner: "deessejs",
  repo: `${category}-template`,
  license: "MIT",
  category,
  labels: ["nextjs"],
}))

/** A second row in one category, on a different framework. */
const ASTRO_ROW: TemplateV1 = {
  slug: "docs-starter-astro",
  name: "Docs starter on Astro",
  description: "",
  owner: "deessejs",
  repo: "docs-astro-template",
  license: "MIT",
  category: "docs",
  labels: ["astro"],
}

const CATALOG = [...FIXTURE, ASTRO_ROW]

describe("resolveTemplateFilter", () => {
  it("reads a single value", () => {
    const filter = resolveTemplateFilter({ type: "desktop" })
    expect(filter.activeTypes).toEqual(["desktop"])
  })

  it("reads a repeated value", () => {
    const filter = resolveTemplateFilter({ type: ["desktop", "docs"] })
    expect(filter.activeTypes).toEqual(["desktop", "docs"])
  })

  it("drops a value the map does not declare", () => {
    const filter = resolveTemplateFilter({
      type: ["desktop", "not-a-category"],
    })
    expect(filter.activeTypes).toEqual(["desktop"])
  })

  it("drops a repeated value", () => {
    const filter = resolveTemplateFilter({ type: ["desktop", "desktop"] })
    expect(filter.activeTypes).toEqual(["desktop"])
  })
})

describe("filterTemplates", () => {
  it("returns every row when no axis is selected", () => {
    const filter = resolveTemplateFilter({})
    expect(filterTemplates(CATALOG, filter)).toHaveLength(CATALOG.length)
  })

  it.each(Object.keys(CATEGORY_LABELS))(
    "returns the rows of the %s category",
    (category) => {
      const filter = resolveTemplateFilter({ type: [category] })
      const rows = filterTemplates(CATALOG, filter)
      expect(rows.every((row) => row.category === category)).toBe(true)
      expect(rows.length).toBeGreaterThan(0)
    },
  )

  it("keeps only the rows matching both axes", () => {
    const filter = resolveTemplateFilter({
      type: ["docs"],
      framework: ["nextjs"],
    })
    const rows = filterTemplates(CATALOG, filter)
    expect(rows.map((row) => row.slug)).toEqual(["docs-starter"])
  })

  it("drops the rows that miss the framework axis", () => {
    const filter = resolveTemplateFilter({
      type: ["docs"],
      framework: ["stripe"],
    })
    expect(filterTemplates(CATALOG, filter)).toEqual([])
  })

  it("shows every row when the only value is one the map dropped", () => {
    // An unknown category leaves the axis empty, and an empty axis
    // matches everything. Pinned because it reads like a typo in the
    // URL rather than a filter that returns nothing.
    const filter = resolveTemplateFilter({ type: ["not-a-category"] })
    expect(filter.activeTypes).toEqual([])
    expect(filterTemplates(CATALOG, filter)).toHaveLength(CATALOG.length)
  })
})
