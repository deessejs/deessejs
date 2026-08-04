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
        {
          ...validTemplate,
          slug: "saas-billing",
          name: "SaaS Billing",
          license: "MIT",
          category: "saas",
          labels: ["stripe", "billing", "nextjs", "postgres"],
        },
        {
          ...validTemplate,
          slug: "saas-multi-tenant",
          name: "Multi-tenant SaaS",
          license: "MIT",
          category: "saas",
          labels: ["multi-tenant", "rls", "drizzle", "postgres"],
        },
        {
          ...validTemplate,
          slug: "saas-onboarding",
          name: "SaaS Onboarding",
          license: "MIT",
          category: "saas",
          labels: ["onboarding", "forms", "react-hook-form", "zod"],
        },
        {
          ...validTemplate,
          slug: "saas-admin",
          name: "Admin Dashboard",
          license: "MIT",
          category: "saas",
          labels: ["admin", "dashboard", "tanstack-table", "charts"],
        },
        {
          ...validTemplate,
          slug: "ai-agents",
          name: "AI Agents",
          license: "Apache-2.0",
          category: "ai",
          labels: ["ai", "agents", "tool-use", "streaming"],
        },
        {
          ...validTemplate,
          slug: "ai-rag",
          name: "AI RAG Pipeline",
          license: "Apache-2.0",
          category: "ai",
          labels: ["ai", "rag", "embeddings", "pgvector"],
        },
        {
          ...validTemplate,
          slug: "ai-image-gen",
          name: "AI Image Generation",
          license: "MIT",
          category: "ai",
          labels: ["ai", "images", "queue", "s3"],
        },
        {
          ...validTemplate,
          slug: "landing-saas",
          name: "SaaS Landing",
          license: "MIT",
          category: "landing",
          labels: ["landing", "pricing", "b2b", "shadcn"],
        },
        {
          ...validTemplate,
          slug: "landing-portfolio",
          name: "Portfolio Landing",
          license: "MIT",
          category: "landing",
          labels: ["landing", "portfolio", "mdx", "astro"],
        },
        {
          ...validTemplate,
          slug: "landing-mobile-promo",
          name: "Mobile App Promo",
          license: "MIT",
          category: "landing",
          labels: ["landing", "mobile", "screenshots", "nextjs"],
        },
      ],
    })
    expect(result.templates).toHaveLength(13)
    expect(result.templates.map((t) => t.slug)).toEqual([
      "saas-starter",
      "ai-chatbot",
      "landing-page",
      "saas-billing",
      "saas-multi-tenant",
      "saas-onboarding",
      "saas-admin",
      "ai-agents",
      "ai-rag",
      "ai-image-gen",
      "landing-saas",
      "landing-portfolio",
      "landing-mobile-promo",
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
