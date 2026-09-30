/**
 * Tests for the in-house glob matcher.
 *
 * The matcher is deliberately minimal: `*`, `**`, `?`, literal
 * characters. Tests pin every supported case so a future "let's
 * add brace expansion" change is forced to think twice.
 */
import { describe, expect, it } from "vitest"

import {
  globToRegExp,
  includeExclude,
  matchAnyGlob,
  matchGlob,
} from "../src/glob.js"

describe("matchGlob", () => {
  it("matches a literal path exactly", () => {
    expect(matchGlob("package.json", "package.json")).toBe(true)
    expect(matchGlob("package.json", "src/index.ts")).toBe(false)
  })

  it("matches * as any non-slash characters", () => {
    expect(matchGlob("*.json", "package.json")).toBe(true)
    expect(matchGlob("*.json", "tsconfig.json")).toBe(true)
    expect(matchGlob("*.json", "src/index.json")).toBe(false) // slash not allowed
    expect(matchGlob("*.json", "package.yaml")).toBe(false)
  })

  it("matches ** across slash boundaries", () => {
    expect(matchGlob("apps/**", "apps/web/package.json")).toBe(true)
    expect(matchGlob("apps/**", "apps/web/src/index.ts")).toBe(true)
    expect(matchGlob("apps/**", "packages/foo.ts")).toBe(false)
  })

  it("matches ? as a single non-slash character", () => {
    expect(matchGlob("a?c", "abc")).toBe(true)
    expect(matchGlob("a?c", "axc")).toBe(true)
    expect(matchGlob("a?c", "ac")).toBe(false) // requires one char
    expect(matchGlob("a?c", "a/c")).toBe(false) // slash not allowed
  })

  it("escapes regex metacharacters", () => {
    expect(matchGlob("foo.bar", "fooXbar")).toBe(false) // . is literal
    expect(matchGlob("foo.bar", "foo.bar")).toBe(true)
    expect(matchGlob("a+b", "a+b")).toBe(true)
    expect(matchGlob("(x)", "(x)")).toBe(true)
    expect(matchGlob("[a]", "[a]")).toBe(true)
  })

  it("matches the package-template reference glob patterns", () => {
    // The exact patterns from the ADR-038 example
    expect(matchGlob(".github/**", ".github/workflows/ci.yml")).toBe(true)
    expect(matchGlob("apps/**", "apps/app/src/index.ts")).toBe(true)
    expect(matchGlob("_registry/**", "_registry/config.ts")).toBe(true)
    expect(matchGlob("node_modules/**", "node_modules/x/index.js")).toBe(true)
  })
})

describe("matchAnyGlob", () => {
  it("returns true when any pattern matches", () => {
    expect(
      matchAnyGlob(
        ["package.json", "pnpm-workspace.yaml"],
        "pnpm-workspace.yaml",
      ),
    ).toBe(true)
  })

  it("returns false when no pattern matches", () => {
    expect(matchAnyGlob(["a.json", "b.json"], "c.json")).toBe(false)
  })

  it("returns false on empty pattern set", () => {
    expect(matchAnyGlob([], "anything")).toBe(false)
  })
})

describe("includeExclude", () => {
  it("includes when path matches include and not exclude", () => {
    expect(
      includeExclude("src/index.ts", ["src/**"], ["**/*.test.ts"]),
    ).toBe(true)
  })

  it("excludes when path matches exclude even if it matches include", () => {
    expect(
      includeExclude("src/foo.test.ts", ["src/**"], ["**/*.test.ts"]),
    ).toBe(false)
  })

  it("excludes when path matches neither include nor exclude", () => {
    expect(
      includeExclude("README.md", ["src/**"], []),
    ).toBe(false)
  })

  it("respects an empty exclude set", () => {
    expect(includeExclude("src/index.ts", ["src/**"], [])).toBe(true)
  })
})

describe("globToRegExp", () => {
  it("returns a RegExp anchored to the full string", () => {
    const re = globToRegExp("*.json")
    expect(re.test("package.json")).toBe(true)
    expect(re.test("packageXjson")).toBe(false) // no substring matches
  })
})