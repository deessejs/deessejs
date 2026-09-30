/**
 * End-to-end tests for the build pipeline.
 *
 * Strategy: build a fake source tree in a temp directory, run
 * `build()`, assert the resulting descriptor matches the
 * TemplateV2 schema and has the right `when` annotations.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { build, buildToString } from "../src/build.js"
import { defineTemplate } from "../src/types.js"

const makeTree = (files: Record<string, string>): string => {
  const cwd = mkdtempSync(join(tmpdir(), "registry-builder-"))
  for (const [path, content] of Object.entries(files)) {
    const abs = join(cwd, path)
    const dir = abs.substring(0, abs.lastIndexOf("/"))
    if (dir !== cwd) mkdirSync(dir, { recursive: true })
    writeFileSync(abs, content, "utf8")
  }
  return cwd
}

const withTree = (
  files: Record<string, string>,
  fn: (cwd: string) => void,
): void => {
  const cwd = makeTree(files)
  try {
    fn(cwd)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
}

describe("build", () => {
  it("emits a flat files[] from a small source tree", () => {
    withTree(
      {
        "package.json": "{}",
        "tsconfig.json": "{}",
        "src/index.ts": "",
        "README.md": "",
      },
      (cwd) => {
        const config = defineTemplate({
          name: "test-template",
          title: "Test Template",
          type: "template:app",
          version: "0.1.0",
          author: "tester",
          source: { repo: "owner/repo" },
          requires: { runtime: "node" },
          files: {
            include: ["package.json", "tsconfig.json", "src/**", "README.md"],
          },
        })
        const result = build(config, { cwd })
        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(result.descriptor.files).toHaveLength(4)
        expect(result.descriptor.files?.map((f) => f.path).sort()).toEqual([
          "README.md",
          "package.json",
          "src/index.ts",
          "tsconfig.json",
        ])
      },
    )
  })

  it("infers the type per extension", () => {
    withTree(
      {
        "src/code.ts": "",
        "src/styles.css": "",
        "docs/readme.md": "",
      },
      (cwd) => {
        const config = defineTemplate({
          name: "test",
          title: "Test",
          type: "template:app",
          version: "0.1.0",
          author: "t",
          source: { repo: "o/r" },
          requires: { runtime: "node" },
          files: { include: ["**"] },
        })
        const result = build(config, { cwd })
        expect(result.ok).toBe(true)
        if (!result.ok) return
        const byPath = Object.fromEntries(
          result.descriptor.files?.map((f) => [f.path, f.type]) ?? [],
        )
        expect(byPath["src/code.ts"]).toBe("template:source")
        expect(byPath["src/styles.css"]).toBe("template:style")
        expect(byPath["docs/readme.md"]).toBe("template:doc")
      },
    )
  })

  it("excludes the default hidden directories", () => {
    withTree(
      {
        "package.json": "{}",
        "node_modules/x/index.js": "// generated",
        "dist/out.js": "// built",
        ".git/HEAD": "ref: refs/heads/main",
      },
      (cwd) => {
        const config = defineTemplate({
          name: "test",
          title: "Test",
          type: "template:app",
          version: "0.1.0",
          author: "t",
          source: { repo: "o/r" },
          requires: { runtime: "node" },
          files: { include: ["**"] },
        })
        const result = build(config, { cwd })
        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(result.descriptor.files?.map((f) => f.path)).toEqual([
          "package.json",
        ])
      },
    )
  })

  it("applies prompts[].excludes with default true", () => {
    withTree(
      {
        "package.json": "{}",
        "apps/app/package.json": "{}",
        "apps/app/src/index.ts": "",
        "packages/utils/package.json": "{}",
      },
      (cwd) => {
        const config = defineTemplate({
          name: "package-template",
          title: "Package Template",
          type: "template:app",
          version: "0.1.0",
          author: "deessejs",
          source: { repo: "deessejs/package-template" },
          requires: { runtime: "node" },
          prompts: [
            {
              name: "includeExampleApp",
              type: "confirm",
              message: "Include example app?",
              default: true,
              excludes: ["apps/app/**"],
            },
          ],
          files: {
            include: ["package.json", "apps/**", "packages/**"],
          },
        })
        const result = build(config, { cwd })
        expect(result.ok).toBe(true)
        if (!result.ok) return
        const gated = result.descriptor.files?.filter(
          (f) => (f as { when?: string }).when === "includeExampleApp",
        )
        expect(gated).toHaveLength(2)
        expect(gated?.map((f) => f.path).sort()).toEqual([
          "apps/app/package.json",
          "apps/app/src/index.ts",
        ])
        expect(
          result.descriptor.files?.find((f) => f.path === "package.json"),
        ).not.toHaveProperty("when")
      },
    )
  })

  it("sorts files deterministically for byte-stable output", () => {
    withTree(
      {
        "z.ts": "",
        "a.ts": "",
        "m.ts": "",
      },
      (cwd) => {
        const config = defineTemplate({
          name: "test",
          title: "Test",
          type: "template:app",
          version: "0.1.0",
          author: "t",
          source: { repo: "o/r" },
          requires: { runtime: "node" },
          files: { include: ["**"] },
        })
        const a = buildToString(config, { cwd })
        const b = buildToString(config, { cwd })
        expect(a).toBe(b)
      },
    )
  })

  it("rejects invalid config with a structured error array", () => {
    withTree({}, (cwd) => {
      const result = build(
        {
          name: "test",
          title: "Test",
          version: "0.1.0",
          author: "t",
          source: { repo: "o/r" },
          requires: { runtime: "node" },
          files: { include: ["**"] },
        } as never,
        { cwd },
      )
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.length).toBeGreaterThan(0)
    })
  })
})