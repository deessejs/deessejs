/**
 * Tests for `packages/registry-client/src/resolve.ts`.
 *
 * Pure-function coverage. We exercise the glob pipeline against a
 * representative `TemplateV2` descriptor shape and a synthetic
 * GitHub tree.
 */

import { describe, expect, it } from "vitest"

import { resolveFiles } from "../src/resolve.js"

const descriptor = (overrides: {
  includes?: string[]
  excludes?: string[]
  fileTypes?: Record<string, string>
  files?: Array<{ path: string; type: string; target?: string; transform?: string }>
}) => ({
  ...(overrides.includes !== undefined ? { includes: overrides.includes } : {}),
  ...(overrides.excludes !== undefined ? { excludes: overrides.excludes } : {}),
  ...(overrides.fileTypes !== undefined ? { fileTypes: overrides.fileTypes } : {}),
  ...(overrides.files !== undefined ? { files: overrides.files } : {}),
})

describe("resolveFiles", () => {
  it("returns all paths when includes=['**'] and excludes=[]", () => {
    const tree = ["a.ts", "b.md", "c.json"]
    const result = resolveFiles(descriptor({ includes: ["**"] }), tree)
    expect(result.map((f) => f.path).sort()).toEqual(["a.ts", "b.md", "c.json"])
  })

  it("defaults to ['**'] when includes is absent", () => {
    const tree = ["a.ts", "b.md"]
    const result = resolveFiles(descriptor({}), tree)
    expect(result.map((f) => f.path).sort()).toEqual(["a.ts", "b.md"])
  })

  it("filters by includes: ['apps/**']", () => {
    const tree = ["apps/web/index.ts", "apps/web/lib/foo.ts", "docs/README.md"]
    const result = resolveFiles(descriptor({ includes: ["apps/**"] }), tree)
    expect(result.map((f) => f.path).sort()).toEqual([
      "apps/web/index.ts",
      "apps/web/lib/foo.ts",
    ])
  })

  it("subtracts excludes: ['**/*.test.ts']", () => {
    const tree = ["src/foo.ts", "src/foo.test.ts", "src/bar.ts"]
    const result = resolveFiles(
      descriptor({ includes: ["src/**"], excludes: ["**/*.test.ts"] }),
      tree,
    )
    expect(result.map((f) => f.path).sort()).toEqual(["src/bar.ts", "src/foo.ts"])
  })

  it("applies fileTypes override before extension heuristic", () => {
    const tree = ["README.md", "LICENSE"]
    const result = resolveFiles(
      descriptor({
        includes: ["**"],
        fileTypes: { "LICENSE": "template:config" },
      }),
      tree,
    )
    const license = result.find((f) => f.path === "LICENSE")
    const readme = result.find((f) => f.path === "README.md")
    expect(license?.kind).toBe("template:config")
    expect(readme?.kind).toBe("template:doc") // extension heuristic
  })

  it("infers template:source from .ts extension", () => {
    const result = resolveFiles(descriptor({}), ["foo.ts"])
    expect(result[0]?.kind).toBe("template:source")
  })

  it("infers template:doc from .md extension", () => {
    const result = resolveFiles(descriptor({}), ["README.md"])
    expect(result[0]?.kind).toBe("template:doc")
  })

  it("falls back to template:asset for unknown extensions", () => {
    const result = resolveFiles(descriptor({}), ["image.xyz"])
    expect(result[0]?.kind).toBe("template:asset")
  })

  it("dedupes path: explicit descriptor.files wins over tree match", () => {
    const tree = ["src/foo.ts"]
    const result = resolveFiles(
      descriptor({
        includes: ["**"],
        files: [{ path: "src/foo.ts", type: "template:test" }],
      }),
      tree,
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.kind).toBe("template:test")
    expect(result[0]?.source).toBe("descriptor")
  })

  it("marks tree-matched files with source='tree'", () => {
    const result = resolveFiles(descriptor({ includes: ["**"] }), ["foo.ts"])
    expect(result[0]?.source).toBe("tree")
  })

  it("sorts results by path ascending", () => {
    const tree = ["z.ts", "a.ts", "m.ts"]
    const result = resolveFiles(descriptor({ includes: ["**"] }), tree)
    expect(result.map((f) => f.path)).toEqual(["a.ts", "m.ts", "z.ts"])
  })
})