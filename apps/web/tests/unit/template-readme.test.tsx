// Render-level tests for TemplateReadme.
//
// Goals:
//   1. Verify the component returns null when the README is missing.
//   2. Verify that hostile Markdown produces sanitized output.
//   3. Verify the link override pins target + rel.
//   4. Verify GFM features render.
//
// The component is async (MarkdownAsync) so rehype-pretty-code's async
// transformer is supported. Tests use renderToString instead of
// renderToStaticMarkup.
//
// File is .tsx for syntax. The vitest unit include glob only matches
// .test.ts, so this file is exercised by the dev workflow + e2e
// harness, not the unit runner. Pure-helper unit tests live in
// safe-readme.test.ts.
import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { TemplateReadme } from "../../src/components/templates/template-readme.js"

describe("TemplateReadme", () => {
  it("renders nothing when readme is undefined", async () => {
    const html = await renderToString(<TemplateReadme readme={undefined} />)
    expect(html).toBe("")
  })

  it("renders nothing when readme is the empty string", async () => {
    const html = await renderToString(<TemplateReadme readme="" />)
    expect(html).toBe("")
  })

  it("renders the section when readme is provided", async () => {
    const html = await renderToString(
      <TemplateReadme readme={"# Hello\n\nWorld."} />,
    )
    expect(html).toContain('data-testid="template-readme"')
    expect(html).toContain("Hello")
    expect(html).toContain("<h1")
    expect(html).toContain("<p>World.</p>")
  })

  it("strips embedded <script> tags from the rendered HTML", async () => {
    const hostile = `# Hi\n\n<script>alert(1)</script>\n\nSafe text.`
    const html = await renderToString(<TemplateReadme readme={hostile} />)

    expect(html).not.toContain("<script")
    expect(html).not.toContain("alert(1)")
    expect(html).toContain("Safe text.")
  })

  it("strips embedded <iframe> tags from the rendered HTML", async () => {
    const hostile = `# Hi\n\n<iframe src="https://evil.example"></iframe>\n\nSafe.`
    const html = await renderToString(<TemplateReadme readme={hostile} />)

    expect(html).not.toContain("<iframe")
    expect(html).toContain("Safe.")
  })

  it("drops javascript: links from the rendered HTML", async () => {
    const hostile = `[Click me](javascript:alert(1))`
    const html = await renderToString(<TemplateReadme readme={hostile} />)

    expect(html).not.toContain("javascript:")
    expect(html).not.toContain("alert(1)")
  })

  it("keeps safe https links and pins target/rel attributes", async () => {
    const readme = `[GitHub](https://github.com/deessejs/saas-template)`
    const html = await renderToString(<TemplateReadme readme={readme} />)

    expect(html).toContain('href="https://github.com/deessejs/saas-template"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it("renders GFM tables", async () => {
    const readme = `| Name | Value |\n|------|-------|\n| A    | 1     |\n| B    | 2     |`
    const html = await renderToString(<TemplateReadme readme={readme} />)

    expect(html).toContain("<table")
    expect(html).toContain("<th")
    expect(html).toContain("<td")
    expect(html).toContain("A")
    expect(html).toContain("B")
  })

  it("strips inline event handlers from rendered HTML", async () => {
    const hostile = `<img src="x" onerror="alert(1)">`
    const html = await renderToString(<TemplateReadme readme={hostile} />)

    expect(html).not.toContain("onerror")
    expect(html).not.toContain("alert(1)")
  })
})
