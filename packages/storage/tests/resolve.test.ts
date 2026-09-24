import { describe, expect, it } from "vitest"

import {
  DEFAULT_BASE,
  LATEST,
  catalogueUrl,
  itemUrl,
  latestUrl,
  parseRef,
  refToString,
} from "../src/resolve.js"

describe("parseRef", () => {
  it("parses 'latest' as the magic string", () => {
    expect(parseRef("latest")).toEqual({ kind: "latest" })
  })

  it("parses semver tags with v-prefix", () => {
    expect(parseRef("v1.4.0")).toEqual({ kind: "tag", tag: "v1.4.0" })
  })

  it("normalises unprefixed semver (1.4.0 -> v1.4.0)", () => {
    expect(parseRef("1.4.0")).toEqual({ kind: "tag", tag: "v1.4.0" })
  })

  it("preserves pre-release and build metadata", () => {
    expect(parseRef("v2.1.0-beta.3")).toEqual({
      kind: "tag",
      tag: "v2.1.0-beta.3",
    })
  })

  it("parses short SHA-1 (7 hex chars)", () => {
    expect(parseRef("a1b2c3d")).toEqual({ kind: "sha", sha: "a1b2c3d" })
  })

  it("parses full SHA-1 (40 hex chars)", () => {
    const fullSha = "a".repeat(40)
    expect(parseRef(fullSha)).toEqual({ kind: "sha", sha: fullSha })
  })

  it("parses branch names", () => {
    expect(parseRef("main")).toEqual({ kind: "branch", branch: "main" })
    expect(parseRef("feat/adr-031")).toEqual({
      kind: "branch",
      branch: "feat/adr-031",
    })
  })

  it("refuses malformed refs with a clear error", () => {
    expect(() => parseRef("not!a!ref")).toThrow(/Invalid ref/)
    expect(() => parseRef("")).toThrow(/Invalid ref/)
  })
})

describe("refToString", () => {
  it("stringifies all ref variants", () => {
    expect(refToString({ kind: "latest" })).toBe(LATEST)
    expect(refToString({ kind: "tag", tag: "v1.0.0" })).toBe("v1.0.0")
    expect(refToString({ kind: "branch", branch: "main" })).toBe("main")
    expect(refToString({ kind: "sha", sha: "a1b2c3d" })).toBe("a1b2c3d")
  })
})

describe("URL builders", () => {
  it("catalogue uses the default base", () => {
    expect(catalogueUrl()).toBe(`${DEFAULT_BASE}/registry.json`)
  })

  it("item URLs are immutable-by-ref", () => {
    expect(itemUrl(DEFAULT_BASE, "saas-starter", "v1.4.0")).toBe(
      "https://registry.deessejs.com/r/saas-starter@v1.4.0.json",
    )
  })

  it("latest URL is a redirector, not a resolvable tag", () => {
    expect(latestUrl(DEFAULT_BASE, "saas-starter")).toBe(
      "https://registry.deessejs.com/r/saas-starter/latest.json",
    )
  })

  it("itemUrl percent-encodes slug and ref", () => {
    const url = itemUrl(DEFAULT_BASE, "feat/block-a", "feat/branch-x")
    // branch refs contain slashes; they need encoding in the path.
    // The base slug is also prefixed @ so ref encoding happens after.
    expect(url).toContain("feat%2Fbranch-x")
  })

  it("rejects malformed refs at URL build time", () => {
    expect(() => itemUrl(DEFAULT_BASE, "saas", "not a ref")).toThrow()
  })

  it("accepts a custom base URL", () => {
    expect(catalogueUrl("https://staging.deessejs.com")).toBe(
      "https://staging.deessejs.com/registry.json",
    )
  })
})
