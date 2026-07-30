/**
 * Templates registry data for the DeesseJS CLI.
 *
 * The templates endpoint at /api/templates serves this list to the CLI's
 * `deessejs list` / `info` / `init` commands. The CLI validates the shape
 * via `isTemplate` in apps/cli/src/api.ts, so any field added here must
 * either be added there or marked optional in the schema.
 *
 * V1 is hand-curated. V1.1+ could swap this for a DB-backed source. The
 * `cloneUrl` field is optional per template; it overrides the default
 * `https://github.com/<owner>/<repo>` lookup in the CLI.
 */
export type Template = {
  slug: string
  name: string
  description: string
  owner: string
  repo: string
  license: string
  category: string
  labels: string[]
  image?: string
  cloneUrl?: string
}

export const TEMPLATES: Template[] = [
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
