/**
 * Regression tests for `TemplateLabels`.
 *
 * Originally caught: production crash on `/templates` with
 *   TypeError: Cannot read properties of undefined (reading 'length')
 *   digest: '551940582'
 *
 * Root cause: `template.labels` arrived undefined on the upstream
 * payload (GitHub API hiccup, registry drift). `TemplateLabels`
 * was called with `labels={undefined}` and the first line
 *   `if (labels.length === 0) return null`
 * threw, breaking the entire SSR render.
 *
 * Fix: short-circuit on missing/empty input. This file pins the
 * behaviour so a future refactor cannot regress to a `length`
 * access on a possibly-undefined value.
 */
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { TemplateLabels } from "../../src/components/templates/template-labels.js"

describe("TemplateLabels", () => {
  it("renders badges for valid labels", () => {
    const html = renderToStaticMarkup(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      TemplateLabels({ labels: ["nextjs", "saas"] } as any),
    )
    expect(html).toContain("nextjs")
    expect(html).toContain("saas")
  })

  it("returns null when labels is undefined (regression for prod crash)", () => {
    let caught: unknown
    try {
      renderToStaticMarkup(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        TemplateLabels({ labels: undefined } as any),
      )
    } catch (e) {
      caught = e
    }
    expect(caught).toBeUndefined()
  })

  it("returns null when labels is empty", () => {
    const html = renderToStaticMarkup(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      TemplateLabels({ labels: [] } as any),
    )
    expect(html).toBe("")
  })
})
