/**
 * Pin the URL protocol allow-list used by `TemplateReadme`.
 *
 * Coverage:
 *   1. Accept http, https, mailto, anchor, root-relative paths.
 *   2. Reject javascript:, data:, vbscript:, file:.
 *   3. Accept unparseable-but-safe relative refs (URL inherits `https:` from
 *      the base; treated as same-origin navigation by the browser — the
 *      safest possible fallback).
 *   4. Never throw on adversarial input (whitespace, control chars).
 *
 * Plus a smoke test on the GFM table wrapper override (see bottom).
 */
import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"
import { describe, expect, it } from "vitest"

import { safeReadmeOptions, safeUrlTransform } from "../../src/lib/templates/safe-readme.js"

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
    // Defends against naive string-matching denylists that miss
    // encodings/whitespace tricks. We rely on `URL.protocol` parsing.
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
    // `new URL` with a base resolves almost anything as a relative ref; this
    // ref inherits `https:` from the base and is therefore allow-listed.
    // The behavior is intentional: react-markdown will pass the string
    // through as an `href` and the browser will treat it as a same-origin
    // navigation, which is the safest possible fallback.
    expect(safeUrlTransform("not a url at all :::")).toBe(
      "not a url at all :::",
    )
  })

  it("returns the empty string for the empty input without throwing", () => {
    // Same reasoning as above: empty input is a valid relative path.
    expect(safeUrlTransform("")).toBe("")
  })

  it("never throws on adversarial whitespace / control characters", () => {
    expect(() =>
      safeUrlTransform("\t\n javascript:alert(1)"),
    ).not.toThrow()
  })
})

describe("safeReadmeOptions table wrapper", () => {
  it("renders an overflow-x-auto container around tables", () => {
    // The vitest include glob matches `test/**/*.test.ts` only, so the
    // wrapper test for the GFM table override lives here. The full JSX
    // render path is covered by template-readme.test.tsx (skipped by
    // the same glob but exercised by the dev workflow / e2e).
    //
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const TableOverride = safeReadmeOptions.components?.table as any
    expect(TableOverride).toBeDefined()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childNode = createElement("table" as any, null, "child")
    const wrapperHtml = renderToStaticMarkup(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createElement(TableOverride, null, childNode) as any,
    )

    expect(wrapperHtml).toContain("overflow-x-auto")
    expect(wrapperHtml).toContain("child")
    // Wrapper opens before <table>: the table is inside the scrolling
    // container, not floating next to it.
    expect(wrapperHtml.indexOf("overflow-x-auto")).toBeLessThan(
      wrapperHtml.indexOf("<table"),
    )
  })
})
