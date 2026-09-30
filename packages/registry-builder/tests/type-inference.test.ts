/**
 * Tests for extension-based file type inference.
 *
 * The mapping is a closed list (per ADR-032). Tests pin every
 * category so a future "let's add .vue as source" change is
 * forced to update tests AND the Zod enum in contracts.
 */
import { describe, expect, it } from "vitest"

import { inferFileType } from "../src/type-inference.js"

describe("inferFileType", () => {
  describe("source extensions", () => {
    it.each([
      [".ts", "src/index.ts"],
      [".tsx", "src/Button.tsx"],
      [".js", "lib/utils.js"],
      [".jsx", "components/Card.jsx"],
      [".mjs", "scripts/migrate.mjs"],
      [".cjs", "scripts/setup.cjs"],
    ])("classifies %s as template:source", (_ext, path) => {
      expect(inferFileType(path)).toBe("template:source")
    })
  })

  describe("config extensions", () => {
    it.each([
      "package.json",
      "tsconfig.json",
      "turbo.json",
      "pnpm-workspace.yaml",
      ".npmrc",
      ".editorconfig",
      ".prettierrc",
      ".vale.ini",
    ])("classifies %s as template:config", (path) => {
      expect(inferFileType(path)).toBe("template:config")
    })
  })

  describe("style extensions", () => {
    it.each(["globals.css", "theme.scss", "tokens.sass"])(
      "classifies %s as template:style",
      (path) => {
        expect(inferFileType(path)).toBe("template:style")
      },
    )
  })

  describe("test extensions", () => {
    it.each(["foo.test.ts", "bar.spec.ts", "Card.test.tsx"])(
      "classifies %s as template:test (NOT template:source)",
      (path) => {
        expect(inferFileType(path)).toBe("template:test")
      },
    )
  })

  describe("doc extensions", () => {
    it.each(["README.md", "docs/architecture.mdx", "NOTES.txt"])(
      "classifies %s as template:doc",
      (path) => {
        expect(inferFileType(path)).toBe("template:doc")
      },
    )
  })

  describe("env extensions", () => {
    it.each([".env", ".env.example", ".env.local"])(
      "classifies %s as template:env",
      (path) => {
        expect(inferFileType(path)).toBe("template:env")
      },
    )
  })

  it("returns template:file for unknown extensions", () => {
    expect(inferFileType("foo.xyz")).toBe("template:file")
    expect(inferFileType("Makefile")).toBe("template:file")
  })

  it("matches the longer extension first (test > ts)", () => {
    expect(inferFileType("foo.test.ts")).toBe("template:test")
    expect(inferFileType("foo.ts")).toBe("template:source")
  })
})