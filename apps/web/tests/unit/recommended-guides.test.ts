import { describe, expect, it } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { validateRecommendedGuideSlugs } from "../../src/lib/knowledge-base/recommended-guides.js"
import { RecommendedGuides } from "../../src/components/knowledge-base/recommended-guides"

describe("recommended KB guides", () => {
  it("accepts recommendations that reference known guide slugs", () => {
    expect(() =>
      validateRecommendedGuideSlugs(
        "getting-started",
        ["install-deessejs-cli", "deploy-to-vercel"],
        new Set(["install-deessejs-cli", "deploy-to-vercel"])
      )
    ).not.toThrow()
  })

  it("rejects an unknown recommended guide slug", () => {
    expect(() =>
      validateRecommendedGuideSlugs(
        "getting-started",
        ["missing-guide"],
        new Set(["install-deessejs-cli"])
      )
    ).toThrow('Topic "getting-started" recommends unknown guide "missing-guide".')
  })

  it("renders recommended guide cards under a dedicated heading", () => {
    const markup = renderToStaticMarkup(
      createElement(RecommendedGuides, {
        guides: [
          {
            title: "Install the deessejs CLI",
            description: "Set up the CLI.",
            products: [],
            url: "/knowledge-base/guides/install-deessejs-cli",
            readingTime: 2,
            slug: "install-deessejs-cli",
          },
        ] as never,
      })
    )

    expect(markup).toContain("Recommended guides")
    expect(markup).toContain("Install the deessejs CLI")
    expect(markup).toContain("/knowledge-base/guides/install-deessejs-cli")
  })
})
