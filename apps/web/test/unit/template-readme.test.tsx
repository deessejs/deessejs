/**
 * Render-level tests for `TemplateReadme`.
 *
 * Goals:
 *   1. Verify the component returns null when the README is missing
 *      (no section rendered, no empty card).
 *   2. Verify that hostile Markdown — embedded `<script>`, `<iframe>`, and
 *      `javascript:` URLs — produces sanitized output: no `<script>` /
 *      `<iframe>` element reaches the DOM, and `javascript:` URLs are
 *      dropped to `#` by react-markdown when `urlTransform` rejects them.
 *   3. Verify the `components.a` override attaches `target="_blank"` and
 *      `rel="noopener noreferrer"` to every link.
 *   4. Verify GFM features (tables) render as tables.
 *
 * Why `renderToStaticMarkup` and not a DOM: react-markdown runs in the RSC
 * payload; the component is a Server Component. `renderToStaticMarkup`
 * exercises the same code path with no DOM dependency.
 */
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { TemplateReadme } from "../../src/components/templates/template-readme.js"

describe("TemplateReadme", () => {
  it("renders nothing when readme is undefined", () => {
    const html = renderToStaticMarkup(<TemplateReadme readme={undefined} />)
    expect(html).toBe("")
  })

  it("renders nothing when readme is the empty string", () => {
    const html = renderToStaticMarkup(<TemplateReadme readme="" />)
    expect(html).toBe("")
  })

  it("renders the section when readme is provided", () => {
    const html = renderToStaticMarkup(
      <TemplateReadme readme={"# Hello\n\nWorld."} />,
    )
    expect(html).toContain('data-testid="template-readme"')
    expect(html).toContain("Hello")
    expect(html).toContain("<h1")
    expect(html).toContain("<p>World.</p>")
  })

  it("strips embedded <script> tags from the rendered HTML", () => {
    const hostile = `# Hi\n\n<script>alert(1)</script>\n\nSafe text.`
    const html = renderToStaticMarkup(<TemplateReadme readme={hostile} />)

    expect(html).not.toContain("<script")
    expect(html).not.toContain("alert(1)")
    expect(html).toContain("Safe text.")
  })

  it("strips embedded <iframe> tags from the rendered HTML", () => {
    const hostile = `# Hi\n\n<iframe src="https://evil.example"></iframe>\n\nSafe.`
    const html = renderToStaticMarkup(<TemplateReadme readme={hostile} />)

    expect(html).not.toContain("<iframe")
    expect(html).toContain("Safe.")
  })

  it("drops javascript: links from the rendered HTML", () => {
    const hostile = `[Click me](javascript:alert(1))`
    const html = renderToStaticMarkup(<TemplateReadme readme={hostile} />)

    expect(html).not.toContain("javascript:")
    expect(html).not.toContain("alert(1)")
  })

  it("keeps safe https links and pins target/rel attributes", () => {
    const readme = `[GitHub](https://github.com/deessejs/saas-template)`
    const html = renderToStaticMarkup(<TemplateReadme readme={readme} />)

    expect(html).toContain('href="https://github.com/deessejs/saas-template"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it("renders GFM tables", () => {
    const readme = `| Name | Value |\n|------|-------|\n| A    | 1     |\n| B    | 2     |`
    const html = renderToStaticMarkup(<TemplateReadme readme={readme} />)

    expect(html).toContain("<table")
    expect(html).toContain("<th")
    expect(html).toContain("<td")
    expect(html).toContain("A")
    expect(html).toContain("B")
  })

  it("strips inline event handlers from rendered HTML", () => {
    const hostile = `<img src="x" onerror="alert(1)">`
    const html = renderToStaticMarkup(<TemplateReadme readme={hostile} />)

    expect(html).not.toContain("onerror")
    expect(html).not.toContain("alert(1)")
  })
})
