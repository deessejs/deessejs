import { describe, expect, it } from "vitest"
import { semverRangeSatisfies } from "../../src/utils/add-plan.js"

describe("block dependency range compatibility", () => {
  it("accepts an existing range fully contained by the requested range", () => {
    expect(semverRangeSatisfies("^1.2.3", ">=1.0.0 <2.0.0")).toBe(true)
  })

  it("rejects ranges that only partially overlap", () => {
    expect(semverRangeSatisfies("^1.0.0", "^1.4.0")).toBe(false)
  })

  it("handles unions, prereleases, wildcards, and invalid syntax using semver", () => {
    expect(semverRangeSatisfies("1.2.x || 1.3.x", ">=1.0.0 <2.0.0")).toBe(true)
    expect(semverRangeSatisfies("1.2.3-beta.1", ">=1.2.3-beta.0 <1.2.3")).toBe(true)
    expect(semverRangeSatisfies("*", "^1.0.0")).toBe(false)
    expect(semverRangeSatisfies("not-a-range", "^1.0.0")).toBe(false)
  })
})
