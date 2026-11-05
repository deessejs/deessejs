import { describe, expect, it } from "vitest"
import { parseProjectConfig } from "../../src/v1/project-config.js"

describe("project config package targets", () => {
  it("normalizes declared package target roots without changing V1", () => {
    expect(parseProjectConfig({ formatVersion: 1, packageTargets: { web: { root: "./apps//web/" } } })).toEqual({
      success: true,
      data: { formatVersion: 1, packageTargets: { web: { root: "apps/web" } } },
    })
  })

  it("allows the workspace root only when explicitly declared", () => {
    expect(parseProjectConfig({ formatVersion: 1, packageTargets: { root: { root: "." } } }).success).toBe(true)
  })

  it("rejects traversal and unknown target fields", () => {
    expect(parseProjectConfig({ formatVersion: 1, packageTargets: { web: { root: "../web" } } }).success).toBe(false)
    expect(parseProjectConfig({ formatVersion: 1, packageTargets: { web: { root: "apps/web", package: "web" } } }).success).toBe(false)
  })
})
