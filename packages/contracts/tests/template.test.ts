import { describe, expect, it } from "vitest"
import { TemplateV1, TemplatesListResponseV1 } from "../src/v1/index.js"

const validTemplate = {
  slug: "saas-starter",
  name: "SaaS Starter",
  description: "Production-ready Next.js + Better Auth + Postgres boilerplate.",
  owner: "deessejs",
  repo: "deessejs",
  license: "MIT",
  category: "saas",
  labels: ["nextjs", "saas", "auth", "postgres"],
}

describe("TemplateV1", () => {
  it("parses a minimal valid template", () => {
    const result = TemplateV1.parse(validTemplate)
    expect(result.slug).toBe("saas-starter")
    expect(result.labels).toEqual(["nextjs", "saas", "auth", "postgres"])
  })

  it("accepts optional image and cloneUrl", () => {
    const result = TemplateV1.parse({
      ...validTemplate,
      image: "https://cdn.example.com/saas.png",
      cloneUrl: "https://github.com/deessejs/deessejs.git",
    })
    expect(result.image).toBe("https://cdn.example.com/saas.png")
    expect(result.cloneUrl).toBe(
      "https://github.com/deessejs/deessejs.git",
    )
  })

  it("rejects a missing slug", () => {
    const { slug, ...rest } = validTemplate
    expect(slug).toBe("saas-starter") // referenced to keep the destructure used
    expect(() => TemplateV1.parse(rest)).toThrow()
  })

  it("rejects a non-string label entry", () => {
    expect(() =>
      TemplateV1.parse({ ...validTemplate, labels: ["ok", 42] }),
    ).toThrow()
  })

  it("rejects a non-array labels", () => {
    expect(() =>
      TemplateV1.parse({ ...validTemplate, labels: "nextjs" }),
    ).toThrow()
  })
})

describe("TemplatesListResponseV1", () => {
  it("parses the current hand-curated registry shape", () => {
    const result = TemplatesListResponseV1.parse({
      templates: [
        validTemplate,
        {
          ...validTemplate,
          slug: "ai-chatbot",
          name: "AI Chatbot",
          license: "Apache-2.0",
          category: "ai",
          labels: ["ai", "openai", "nextjs", "rag"],
        },
        {
          ...validTemplate,
          slug: "landing-page",
          name: "Landing Page",
          license: "MIT",
          category: "landing",
          labels: ["astro", "tailwind", "marketing", "shadcn"],
        },
      ],
    })
    expect(result.templates).toHaveLength(3)
    expect(result.templates.map((t) => t.slug)).toEqual([
      "saas-starter",
      "ai-chatbot",
      "landing-page",
    ])
  })

  it("accepts an empty list", () => {
    expect(TemplatesListResponseV1.parse({ templates: [] }).templates).toEqual(
      [],
    )
  })

  it("rejects a missing templates key", () => {
    expect(() => TemplatesListResponseV1.parse({})).toThrow()
  })

  it("rejects a non-array templates value", () => {
    expect(() =>
      TemplatesListResponseV1.parse({ templates: "not-an-array" }),
    ).toThrow()
  })
})
