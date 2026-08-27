/**
 * Pin the URL protocol allow-list used by TemplateReadme.
 *
 * Coverage:
 *   1. Accept http, https, mailto, anchor, root-relative paths.
 *   2. Reject javascript:, data:, vbscript:, file:.
 *   3. Accept unparseable-but-safe relative refs (URL inherits https
 *      from the base; treated as same-origin navigation by the browser).
 *   4. Never throw on adversarial input (whitespace, control chars).
 *
 * The helper lives in apps/web/src/lib/templates/safe-readme.tsx
 * alongside the JSX-bearing components map. That file imports
 * React and react-markdown, which the vitest `.test.ts` filter
 * cannot resolve through esbuild. Rather than splitting the
 * rendering module into a `.ts` and `.tsx` pair, we copy the
 * `safeUrlTransform` body here. If the upstream changes, update
 * this mirror — the contract is small (8 lines) and the diff
 * stays localised to one line unless the URL allow-list grows.
 *
 * The pipeline-level contract (plugin order, theme choice) is
 * pinned by template-readme.test.tsx where the JSX is acceptable.
 */
import { describe, expect, it } from "vitest"

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"])

const safeUrlTransform = (url: string): string | undefined => {
  if (url.startsWith("#") || url.startsWith("/")) {
    return url
  }
  try {
    const parsed = new URL(url, "https://placeholder.invalid")
    return ALLOWED_PROTOCOLS.has(parsed.protocol) ? url : undefined
  } catch {
    return undefined
  }
}

describe("safeUrlTransform", () => {
  it("accepts https URLs", () => {
    expect(
      safeUrlTransform("https://github.com/deessejs/saas-template"),
    ).toBe("https://github.com/deessejs/saas-template")
  })

  it("accepts http URLs", () => {
    expect(safeUrlTransform("http://example.com")).toBe(
      "http://example.com",
    )
  })

  it("accepts mailto URLs", () => {
    expect(safeUrlTransform("mailto:hello@deessejs.com")).toBe(
      "mailto:hello@deessejs.com",
    )
  })

  it("accepts anchor-only links", () => {
    expect(safeUrlTransform("#installation")).toBe("#installation")
  })

  it("accepts root-relative paths", () => {
    expect(safeUrlTransform("/docs/cli")).toBe("/docs/cli")
  })

  it("rejects javascript: URLs", () => {
    expect(safeUrlTransform("javascript:alert(1)")).toBeUndefined()
  })

  it("rejects javascript: URLs with leading whitespace / casing", () => {
    expect(safeUrlTransform("  JaVaScRiPt:alert(1)")).toBeUndefined()
  })

  it("rejects data: URLs", () => {
    expect(
      safeUrlTransform("data:text/html,<script>alert(1)</script>"),
    ).toBeUndefined()
  })

  it("rejects vbscript: URLs", () => {
    expect(safeUrlTransform("vbscript:msgbox(1)")).toBeUndefined()
  })

  it("rejects file: URLs", () => {
    expect(safeUrlTransform("file:///etc/passwd")).toBeUndefined()
  })

  it("returns the URL for unparseable-but-safe relative refs", () => {
    expect(safeUrlTransform("not a url at all :::")).toBe(
      "not a url at all :::",
    )
  })

  it("returns the empty string for the empty input without throwing", () => {
    expect(safeUrlTransform("")).toBe("")
  })

  it("never throws on adversarial whitespace / control characters", () => {
    expect(() =>
      safeUrlTransform("\t\n javascript:alert(1)"),
    ).not.toThrow()
  })
})
