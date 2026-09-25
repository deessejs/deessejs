/**
 * Single source of truth for use-case capabilities.
 *
 * Each capability has a one-line title + description and a status:
 *   - "shipped"   wired into the registry today (deessejs/saas-template)
 *   - "roadmap"   committed in docs/roadmap/ but not yet shipped
 *
 * Use-case pages pick a curated subset via CAPABILITIES_BY_USE_CASE so the
 * hero shows only the capabilities that apply to that scenario. Pages can
 * also render all capabilities by passing an empty array.
 */

export type CapabilityStatus = "shipped" | "roadmap"

export type Capability = {
  /** Stable id, used to look up the capability across use-cases. */
  id: string
  /** Short title shown in the capability cell. Title Case. */
  title: string
  /** One-line description. Sentence case, no trailing period. */
  description: string
  status: CapabilityStatus
  /** Required when status === "roadmap". Quarter + year, e.g. "Q4 2026". */
  shippedAt?: string
}

/** Every capability the registry advertises. Order: shipped first, then roadmap chronologically. */
export const CAPABILITIES: ReadonlyArray<Capability> = [
  // SHIPPED — in the registry today
  { id: "auth",            title: "Auth",            description: "Better Auth + email + password reset",           status: "shipped" },
  { id: "database",        title: "Database",        description: "Drizzle + Postgres",                             status: "shipped" },
  { id: "api",             title: "API",             description: "Hono + oRPC, end-to-end typed",                 status: "shipped" },
  { id: "email",           title: "Email",           description: "Resend + React Email",                           status: "shipped" },
  { id: "design-system",   title: "Design system",   description: "shadcn/ui + tokens",                             status: "shipped" },
  { id: "monorepo",        title: "Monorepo",        description: "Turborepo + pnpm",                               status: "shipped" },
  { id: "env-ci",          title: "Env + CI",        description: "Zod + GitHub Actions",                           status: "shipped" },

  // ROADMAP — committed, not shipped
  { id: "multi-tenant",    title: "Multi-tenant",    description: "Workspaces + orgs",                              status: "roadmap", shippedAt: "Q4 2026" },
  { id: "billing",         title: "Billing",         description: "Stripe subscriptions",                           status: "roadmap", shippedAt: "Q4 2026" },
  { id: "mcp",             title: "MCP server",      description: "12 tools exposed",                               status: "roadmap", shippedAt: "Q1 2027" },
  { id: "public-api",      title: "Public API",      description: "Versioned, documented",                          status: "roadmap", shippedAt: "Q1 2027" },
  { id: "admin",           title: "Admin dashboard", description: "Operator console",                               status: "roadmap", shippedAt: "Q1 2027" },
  { id: "blog",            title: "Blog / CMS",      description: "MDX + taxonomy",                                 status: "roadmap", shippedAt: "Q2 2027" },
  { id: "background-jobs", title: "Background jobs", description: "Queues + retries",                               status: "roadmap", shippedAt: "Q2 2027" },
]

/** Capability subset per use-case, in display order. */
export const CAPABILITIES_BY_USE_CASE: Record<string, ReadonlyArray<string>> = {
  "saas-apps": [
    "auth", "database", "api", "email", "design-system", "monorepo", "env-ci",
    "multi-tenant", "billing", "admin", "mcp", "public-api", "blog", "background-jobs",
  ],
  "ai-products":     ["api", "database", "mcp", "email", "background-jobs", "public-api", "auth"],
  "landing-pages":   ["design-system", "monorepo", "env-ci", "blog"],
  "api-backends":    ["api", "database", "auth", "public-api", "env-ci", "background-jobs"],
  "internal-tools":  ["auth", "api", "database", "design-system", "multi-tenant", "admin"],
  "open-source":     ["design-system", "monorepo", "env-ci", "public-api", "blog"],
  "mobile-backend":  ["api", "auth", "database", "email", "background-jobs", "public-api"],
}

/** Resolve a use-case's capability ids into the full Capability objects. */
export function resolveCapabilities(
  useCaseSlug: string
): ReadonlyArray<Capability> {
  const ids = CAPABILITIES_BY_USE_CASE[useCaseSlug] ?? []
  return ids
    .map((id) => CAPABILITIES.find((c) => c.id === id))
    .filter((c): c is Capability => Boolean(c))
}
