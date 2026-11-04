import { describe, expect, it } from "vitest"
import { compareStableVersions } from "../../src/commands/update.js"

describe("compareStableVersions", () => {
  it("orders stable versions by major, minor, and patch", () => {
    expect(compareStableVersions("3.1.0", "3.0.9")).toBeGreaterThan(0)
    expect(compareStableVersions("3.0.9", "3.1.0")).toBeLessThan(0)
    expect(compareStableVersions("3.0.0", "3.0.0")).toBe(0)
  })
})
