/**
 * Templates registry data for the DeesseJS CLI.
 *
 * The shape of each entry is owned by `@workspace/contracts/v1`. This file
 * holds only the hand-curated list (V1). V1.1+ could swap this for a DB-backed
 * source; the wire contract stays the same.
 *
 * The `cloneUrl` field is optional per template; it overrides the default
 * `https://github.com/<owner>/<repo>` lookup in the CLI.
 */
import type { TemplateV1 } from "@workspace/contracts/v1"

export type Template = TemplateV1

export const TEMPLATES: Template[] = [
  {
    slug: "saas-starter",
    name: "SaaS Starter",
    description:
      "Production-ready Next.js + Better Auth + Postgres boilerplate for B2B SaaS.",
    owner: "deessejs",
    repo: "deessejs",
    license: "MIT",
    category: "saas",
    labels: ["nextjs", "saas", "auth", "postgres"],
  },
  {
    slug: "ai-chatbot",
    name: "AI Chatbot",
    description:
      "Next.js + OpenAI streaming chatbot with tool use, RAG, and persistence.",
    owner: "deessejs",
    repo: "ai-chatbot",
    license: "Apache-2.0",
    category: "ai",
    labels: ["ai", "openai", "nextjs", "rag"],
  },
  {
    slug: "landing-page",
    name: "Landing Page",
    description:
      "High-converting Astro + Tailwind marketing site with shadcn blocks.",
    owner: "deessejs",
    repo: "landing-page",
    license: "MIT",
    category: "landing",
    labels: ["astro", "tailwind", "marketing", "shadcn"],
  },
]
