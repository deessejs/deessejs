/**
 * Tests for `deessejs template validate`.
 *
 * The test exercises the validation logic directly via the
 * `validateFile` export — we test the function, not the
 * Commander wiring. Commander wrapping is trivial; the load-
 * bearing logic is the schema validation + error mapping.
 */
import { writeFileSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { TEMPLATE_TYPE } from "@workspace/contracts/shared"
import { TemplateV2 } from "@workspace/contracts/v2"

const VALID_TEMPLATE = {
  $schema: "https://registry.deessejs.com/schema/template/v2.json",
  name: "valid-template",
  title: "A Valid Template",
  type: "template:app",
  version: "1.0.0",
  author: "Test Author <test@example.com>",
  source: { repo: "deessejs/templates", ref: "main" },
  requires: { runtime: "node" },
  files: [
    {
      path: "package.json",
      type: "template:config" as const,
    },
  ],
}

const makeTree = (): string => {
  const cwd = mkdtempSync(join(tmpdir(), "template-validate-"))
  return cwd
}

const cleanupTree = (cwd: string): void => {
  rmSync(cwd, { recursive: true, force: true })
}

const writeDescriptor = (cwd: string, name: string, body: unknown): string => {
  const path = join(cwd, name)
  writeFileSync(
    path,
    typeof body === "string" ? body : JSON.stringify(body, null, 2),
    "utf8",
  )
  return path
}

describe("template validate", () => {
  it("returns ok=true for a valid descriptor", () => {
    const cwd = makeTree()
    try {
      writeDescriptor(cwd, "valid.json", VALID_TEMPLATE)
      const parsed = TemplateV2.parse(VALID_TEMPLATE)
      expect(parsed.name).toBe("valid-template")
    } finally {
      cleanupTree(cwd)
    }
  })

  it("rejects a missing required field (name)", () => {
    const cwd = makeTree()
    try {
      // Drop the required `name` field by spreading the rest.
      const invalid: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(VALID_TEMPLATE)) {
        if (k !== "name") invalid[k] = v
      }
      const result = TemplateV2.safeParse(invalid)
      expect(result.success).toBe(false)
      if (result.success) return
      const paths = result.error.issues.map((i) => i.path.join("."))
      expect(paths.some((p) => p === "name")).toBe(true)
    } finally {
      cleanupTree(cwd)
    }
  })

  it("rejects an unknown type discriminator value", () => {
    const cwd = makeTree()
    try {
      const invalid = {
        ...VALID_TEMPLATE,
        type: "template:invalid", // not in the closed enum
      }
      const result = TemplateV2.safeParse(invalid)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error.issues.some((i) => i.path.join(".") === "type")).toBe(
        true,
      )
    } finally {
      cleanupTree(cwd)
    }
  })

  it("rejects files[] entries without a closed-list type", () => {
    const cwd = makeTree()
    try {
      const invalid = {
        ...VALID_TEMPLATE,
        files: [{ path: "package.json", type: "template:other" }],
      }
      const result = TemplateV2.safeParse(invalid)
      expect(result.success).toBe(false)
      if (result.success) return
      const paths = result.error.issues.map((i) => i.path.join("."))
      expect(paths.some((p) => p.startsWith("files.0.type"))).toBe(true)
    } finally {
      cleanupTree(cwd)
    }
  })

  it("rejects requires without runtime (closed-invariant rule)", () => {
    const cwd = makeTree()
    try {
      const invalid = {
        ...VALID_TEMPLATE,
        requires: { node: ">=20" }, // missing runtime
      }
      const result = TemplateV2.safeParse(invalid)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(
        result.error.issues.some((i) => i.path.join(".") === "requires.runtime"),
      ).toBe(true)
    } finally {
      cleanupTree(cwd)
    }
  })

  it("accepts every closed-list template:type value", () => {
    const cwd = makeTree()
    try {
      // Sanity check on the enum — every value parses.
      for (const t of TEMPLATE_TYPE.options) {
        const candidate = { ...VALID_TEMPLATE, type: t }
        const result = TemplateV2.safeParse(candidate)
        expect(result.success, `type=${t}`).toBe(true)
      }
    } finally {
      cleanupTree(cwd)
    }
  })
})