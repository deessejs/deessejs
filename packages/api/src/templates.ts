/**
 * Templates registry data for the DeesseJS CLI.
 *
 * Each entry declares a slug, the GitHub `owner/repo` to fetch live data
 * from, a static `layer` (open-community | pro | enterprise), and an
 * editorial `category`. The live fields (name, description, license,
 * labels, stars, updatedAt, readme) are populated at request time by
 * `core/templates/enrich.ts`.
 *
 * V1 ships with a single entry: `saas-starter`. Each additional template
 * requires its own GitHub repo to live at the path declared by `owner/repo`.
 * Adding a row here without a matching repo on GitHub makes the templates
 * endpoint return 503 (fail loud).
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
    slug: "saas-starter-multi-tenant",
    name: "SaaS Starter (Multi-Tenant)",
    description:
      "Modern SaaS monorepo template with pnpm workspaces, Turborepo, Drizzle ORM, better-auth, Hono + oRPC.",
    owner: "deessejs",
    repo: "saas-template-multi-tenant",
    license: "MIT",
    category: "saas",
    labels: ["saas", "multi-tenant", "hono", "orpc"],
    layer: "open-community",
  },
  {
    slug: "electron-starter",
    name: "Electron Starter",
    description:
      "A production-ready Electron application template with React 19, TanStack Start, Drizzle ORM, and oRPC.",
    owner: "deessejs",
    repo: "complete-electron-template",
    license: "MIT",
    category: "desktop",
    labels: ["electron", "react", "tanstack-start", "orpc"],
    layer: "open-community",
  },
  {
    slug: "docs-starter",
    name: "Docs Starter",
    description:
      "Documentation site starter built on Next.js 16 + Fumadocs. MDX content, Orama search, OG images, LLM endpoints, Tailwind v4.",
    owner: "deessejs",
    repo: "documentation-template",
    license: "MIT",
    category: "docs",
    labels: ["fumadocs", "mdx", "nextjs", "llms"],
    layer: "open-community",
  },
  {
    slug: "landing-starter",
    name: "Landing Starter",
    description:
      "Landing page starter for SaaS and product marketing sites.",
    owner: "deessejs",
    repo: "landing-template",
    license: "MIT",
    category: "marketing",
    labels: ["landing", "marketing", "nextjs"],
    layer: "open-community",
  },
  {
    slug: "blog-starter",
    name: "Blog Starter",
    description:
      "Blog starter with MDX content, syntax highlighting, and OG image generation.",
    owner: "deessejs",
    repo: "blog-template",
    license: "MIT",
    category: "content",
    labels: ["blog", "content", "mdx", "nextjs"],
    layer: "open-community",
  },
  {
    slug: "package-starter",
    name: "Package Starter",
    description:
      "A TypeScript monorepo template with pnpm workspaces and Turborepo.",
    owner: "deessejs",
    repo: "package-template",
    license: "MIT",
    category: "library",
    labels: ["monorepo", "pnpm", "turborepo", "typescript"],
    layer: "open-community",
  },
  {
    slug: "eve-starter",
    name: "Eve Starter",
    description:
      "Starter template for building, running, and shipping AI agents with eve (by Vercel).",
    owner: "deessejs",
    repo: "eve-template",
    license: "MIT",
    category: "ai-agent",
    labels: ["ai", "agent", "eve", "vercel"],
    layer: "open-community",
  },
]
