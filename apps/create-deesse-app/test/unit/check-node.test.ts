import { describe, expect, it } from "vitest"

import {
  assertSupportedNode,
  MIN_NODE_22_MINOR,
  MIN_NODE_MAJOR,
} from "../../src/check-node.js"

describe("assertSupportedNode", () => {
  it("throws on Node 20", () => {
    expect(() => assertSupportedNode("v20.0.0")).toThrow(/not supported/)
    expect(() => assertSupportedNode("v20.99.99")).toThrow(/not supported/)
  })

  it("throws on Node 18", () => {
    expect(() => assertSupportedNode("v18.19.1")).toThrow(/not supported/)
  })

  it("throws on Node 22.0 through 22.12 (pnpm 11 floor)", () => {
    expect(() => assertSupportedNode("v22.0.0")).toThrow(/not supported/)
    expect(() => assertSupportedNode("v22.12.99")).toThrow(/not supported/)
  })

  it("accepts Node 22.13 and later on the 22 line", () => {
    expect(() => assertSupportedNode("v22.13.0")).not.toThrow()
    expect(() => assertSupportedNode("v22.20.0")).not.toThrow()
  })

  it("accepts Node 24", () => {
    expect(() => assertSupportedNode("v24.0.0")).not.toThrow()
  })

  it("accepts Node 25", () => {
    expect(() => assertSupportedNode("v25.0.0")).not.toThrow()
  })

  it("accepts process.versions.node format (no `v` prefix)", () => {
    expect(() => assertSupportedNode("22.22.2")).not.toThrow()
  })

  it("accepts process.version format (with `v` prefix)", () => {
    expect(() => assertSupportedNode("v22.13.0")).not.toThrow()
  })

  it("throws on malformed input", () => {
    expect(() => assertSupportedNode("not-a-version")).toThrow(/not supported/)
    expect(() => assertSupportedNode("")).toThrow(/not supported/)
  })

  it("exports the floor as a constant", () => {
    expect(MIN_NODE_MAJOR).toBe(22)
    expect(MIN_NODE_22_MINOR).toBe(13)
  })
})
