/**
 * Single source of truth for use-case capabilities.
 *
 * Each capability has a one-line title + description and a status:
 *   - "shipped"   wired into the registry today (apps in this monorepo run on it)
 *   - "roadmap"   committed in docs/roadmap/ but not yet shipped
 *
 * Use-case pages pick a curated subset via CAPABILITIES_BY_USE_CASE so the
 * page surfaces only the capabilities that apply to that scenario. Each
 * capability may carry a `mockupSlug` — a key into the mockup registry
 * shipped by the use-cases tree (`_components/mockups/`). When set, the
 * capability-tabs component renders that mockup as the "peek"
 * illustration when the capability card is selected.
 *
 * Capabilities are intentionally timeless in their display — pages
 * present them without `shipped`/`roadmap` badges (see the user decision
 * recorded in the pilot plan for /use-cases/saas-apps). Status stays in
 * the data for future filtering; badges are a separate product choice.
 */

export type CapabilityStatus = "shipped" | "roadmap"

export type Capability = {
  /** Stable id, used to look up the capability across use-cases. */
  id: string
  /** Short title shown in the capability card. Title Case. */
  title: string
  /** One-line description. Sentence case, no trailing period. */
  description: string
  status: CapabilityStatus
  /** Required when status === "roadmap". Quarter + year, e.g. "Q4 2026". */
  shippedAt?: string
  /** Optional mockup slug — a key into the mockup registry. */
  mockupSlug?: string
}

/** Every capability the registry advertises. Order: shipped first, then roadmap chronologically. */
export const CAPABILITIES: ReadonlyArray<Capability> = [
  // SHIPPED — in the registry today
  { id: "auth",            title: "Auth",            description: "Better Auth + email + password reset",           status: "shipped", mockupSlug: "auth-flow" },
  { id: "database",        title: "Database",        description: "Drizzle + Postgres",                             status: "shipped", mockupSlug: "db-terminal" },
  { id: "api",             title: "API",             description: "Hono + oRPC, end-to-end typed",                  status: "shipped", mockupSlug: "api-endpoint" },
  { id: "email",           title: "Email",           description: "Resend + React Email",                           status: "shipped" },
  { id: "design-system",   title: "Design system",   description: "shadcn/ui + tokens",                             status: "shipped" },
  { id: "monorepo",        title: "Monorepo",        description: "Turborepo + pnpm",                               status: "shipped" },
  { id: "env-ci",          title: "Env + CI",        description: "Zod + GitHub Actions",                           status: "shipped" },

  // ROADMAP — committed, not shipped
  { id: "onboarding",      title: "Onboarding",      description: "Signup + verify + invite teammates",              status: "roadmap", shippedAt: "Q4 2026", mockupSlug: "onboarding" },
  { id: "multi-tenant",    title: "Multi-tenant",    description: "Workspaces + orgs",                               status: "roadmap", shippedAt: "Q4 2026", mockupSlug: "multi-tenant" },
  { id: "billing",         title: "Billing",         description: "Stripe subscriptions + usage metering",           status: "roadmap", shippedAt: "Q4 2026", mockupSlug: "billing" },
  { id: "admin",           title: "Admin dashboard", description: "Operator console",                                status: "roadmap", shippedAt: "Q1 2027", mockupSlug: "admin" },
  { id: "background-jobs", title: "Background jobs", description: "Queues + retries + cron",                         status: "roadmap", shippedAt: "Q2 2027", mockupSlug: "queue-log" },
  { id: "notifications",   title: "Notifications",   description: "In-app + email + batch",                          status: "roadmap", shippedAt: "Q2 2027", mockupSlug: "notifications" },
  { id: "product-crud",    title: "Product CRUD",    description: "Domain data + search + export",                   status: "roadmap", shippedAt: "Q3 2027", mockupSlug: "product-table" },
  { id: "mcp",             title: "MCP server",      description: "12 tools exposed",                                status: "roadmap", shippedAt: "Q1 2027" },
  { id: "public-api",      title: "Public API",      description: "Versioned, documented",                           status: "roadmap", shippedAt: "Q1 2027" },
  { id: "blog",            title: "Blog / CMS",      description: "MDX + taxonomy",                                  status: "roadmap", shippedAt: "Q2 2027" },
  { id: "observability",   title: "Observability",   description: "Logs + traces + metrics",                         status: "shipped", mockupSlug: "otel-waterfall" },
]

/** Capability subset per use-case, in display order. */
export const CAPABILITIES_BY_USE_CASE: Record<string, ReadonlyArray<string>> = {
  "saas-apps": [
    "onboarding",
    "multi-tenant",
    "product-crud",
    "billing",
    "admin",
    "background-jobs",
    "notifications",
    "observability",
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
