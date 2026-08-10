/**
 * Templates registry data for the DeesseJS CLI.
 *
 * Each entry declares a slug, the GitHub `owner/repo` to fetch live data
 * from, a static `layer` (open-community | pro | enterprise), and an
 * editorial `category`. The live fields (name, description, license,
 * labels, stars, updatedAt, readme) are populated at request time by
 * `templates-fetcher.ts`.
 *
 * The 10 dummy entries that used to live here have been removed. The
 * registry grows by adding a row here, not by duplicating static data.
 *
 * Repos here are placeholders. Once each template has its own GitHub
 * repo under `deessejs/<slug>`, swap the owner/repo on the row.
 */
import type { TemplateV1 } from "@workspace/contracts/v1"

export type Template = TemplateV1

export type TemplateLayer = "open-community" | "pro" | "enterprise"

export type RegistryEntry = TemplateV1 & {
  /**
   * Static editorial layer for the template. Layer is not fetched from
   * GitHub — it is a marketing/business decision, not a property of the
   * repo. The fetcher preserves this field on the wire shape.
   */
  layer: TemplateLayer
}

export const TEMPLATES: RegistryEntry[] = [
  {
    slug: "saas-starter",
    name: "SaaS Starter",
    description:
      "Production-ready Next.js + Better Auth + Postgres boilerplate for B2B SaaS.",
    owner: "deessejs",
    repo: "saas-template",
    license: "MIT",
    category: "saas",
    labels: ["nextjs", "saas", "auth", "postgres"],
    layer: "open-community",
  },
  {
    slug: "ai-chatbot",
    name: "AI Chatbot",
    description:
      "Next.js + OpenAI streaming chatbot with tool use, RAG, and persistence.",
    owner: "deessejs",
    repo: "ai-template",
    license: "Apache-2.0",
    category: "ai",
    labels: ["ai", "openai", "nextjs", "rag"],
    layer: "open-community",
  },
  {
    slug: "landing-page",
    name: "Landing Page",
    description:
      "High-converting Astro + Tailwind marketing site with shadcn blocks.",
    owner: "deessejs",
    repo: "landing-template",
    license: "MIT",
    category: "landing",
    labels: ["astro", "tailwind", "marketing", "shadcn"],
    layer: "open-community",
  },
]
