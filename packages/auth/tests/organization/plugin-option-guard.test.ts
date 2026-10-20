import { describe, expect, it } from "vitest"
import { resolveRequireEmailVerification } from "../../src/organization/plugin.js"

describe("resolveRequireEmailVerification", () => {
  it("returns true when raw is 'true'", () => {
    expect(resolveRequireEmailVerification("true", "production")).toBe(true)
    expect(resolveRequireEmailVerification("true", "development")).toBe(true)
  })

  it("returns true when raw is 'true' and NODE_ENV is undefined", () => {
    expect(resolveRequireEmailVerification("true", undefined)).toBe(true)
  })

  it("returns false when raw is 'false' and NODE_ENV is not production", () => {
    expect(resolveRequireEmailVerification("false", "development")).toBe(false)
    expect(resolveRequireEmailVerification("false", "test")).toBe(false)
    expect(resolveRequireEmailVerification("false", undefined)).toBe(false)
  })

  it("throws when raw is 'false' and NODE_ENV is production", () => {
    expect(() => resolveRequireEmailVerification("false", "production")).toThrow(
      /not allowed in production/,
    )
  })

  it("throws with an unknown value", () => {
    expect(() => resolveRequireEmailVerification("yes", "development")).toThrow(
      /must be "true" or "false"/,
    )
    expect(() => resolveRequireEmailVerification("0", "development")).toThrow(
      /must be "true" or "false"/,
    )
    expect(() => resolveRequireEmailVerification("1", "development")).toThrow(
      /must be "true" or "false"/,
    )
  })
})
