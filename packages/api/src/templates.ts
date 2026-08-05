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
    repo: "deessejs",
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
    repo: "deessejs",
    license: "MIT",
    category: "landing",
    labels: ["astro", "tailwind", "marketing", "shadcn"],
  },
  // --- Dummy templates below — V1.1 will replace with curated entries ---
  {
    slug: "saas-billing",
    name: "SaaS Billing",
    description:
      "Stripe subscriptions, customer portal, and webhook handlers wired into a Postgres schema.",
    owner: "deessejs",
    repo: "deessejs",
    license: "MIT",
    category: "saas",
    labels: ["stripe", "billing", "nextjs", "postgres"],
  },
  {
    slug: "saas-multi-tenant",
    name: "Multi-tenant SaaS",
    description:
      "Row-level multi-tenancy with org-scoped tables, invitations, and per-tenant roles.",
    owner: "deessejs",
    repo: "deessejs",
    license: "MIT",
    category: "saas",
    labels: ["multi-tenant", "rls", "drizzle", "postgres"],
  },
  {
    slug: "saas-onboarding",
    name: "SaaS Onboarding",
    description:
      "Multi-step onboarding flow with progress, validation, and resumable state.",
    owner: "deessejs",
    repo: "deessejs",
    license: "MIT",
    category: "saas",
    labels: ["onboarding", "forms", "react-hook-form", "zod"],
  },
  {
    slug: "saas-admin",
    name: "Admin Dashboard",
    description:
      "Operator-facing dashboard with charts, audit logs, and bulk actions on entities.",
    owner: "deessejs",
    repo: "deessejs",
    license: "MIT",
    category: "saas",
    labels: ["admin", "dashboard", "tanstack-table", "charts"],
  },
  {
    slug: "ai-agents",
    name: "AI Agents",
    description:
      "Tool-calling agent harness with streaming, persistence, and a typed tool registry.",
    owner: "deessejs",
    repo: "deessejs",
    license: "Apache-2.0",
    category: "ai",
    labels: ["ai", "agents", "tool-use", "streaming"],
  },
  {
    slug: "ai-rag",
    name: "AI RAG Pipeline",
    description:
      "Vector store ingestion, chunking, embeddings, and a streaming chat endpoint.",
    owner: "deessejs",
    repo: "deessejs",
    license: "Apache-2.0",
    category: "ai",
    labels: ["ai", "rag", "embeddings", "pgvector"],
  },
  {
    slug: "ai-image-gen",
    name: "AI Image Generation",
    description:
      "Provider-agnostic image generation with a queue, retries, and S3-compatible storage.",
    owner: "deessejs",
    repo: "deessejs",
    license: "MIT",
    category: "ai",
    labels: ["ai", "images", "queue", "s3"],
  },
  {
    slug: "landing-saas",
    name: "SaaS Landing",
    description:
      "Pricing matrix, feature grid, and FAQ block — tuned for B2B SaaS conversion.",
    owner: "deessejs",
    repo: "deessejs",
    license: "MIT",
    category: "landing",
    labels: ["landing", "pricing", "b2b", "shadcn"],
  },
  {
    slug: "landing-portfolio",
    name: "Portfolio Landing",
    description:
      "Personal site template with project gallery, MDX content, and a blog.",
    owner: "deessejs",
    repo: "deessejs",
    license: "MIT",
    category: "landing",
    labels: ["landing", "portfolio", "mdx", "astro"],
  },
  {
    slug: "landing-mobile-promo",
    name: "Mobile App Promo",
    description:
      "App-store-ready marketing site with hero, screenshots, and changelog.",
    owner: "deessejs",
    repo: "deessejs",
    license: "MIT",
    category: "landing",
    labels: ["landing", "mobile", "screenshots", "nextjs"],
  },
]