/**
 * Home page data — constants consumed by apps/web/src/app/(marketing)/page.tsx
 * and the marketing section components.
 *
 * Single source of truth for the hard-coded marketing copy and entity
 * lists shown on `/`. Extracted from page.tsx so the page file stays
 * focused on layout orchestration and so the data can be unit-tested
 * (and eventually sourced from content-collections or an external CMS)
 * without dragging React into the test surface.
 *
 * Copy authority lives in
 * `apps/internal-documentation/content/docs/(root)/home-positioning-strategy.mdx`.
 * Numbers in `STATS` and `SKIP_ITEMS` are internal estimates, not
 * fetched from npm/GitHub APIs yet (see the TODO on STATS).
 */

import type { Contract } from "@/app/(marketing)/_components/contracts-grid"

// ---------------------------------------------------------------------------
// Contracts (Section 6: "Under the hood")
// ---------------------------------------------------------------------------

/** The seven contracts wired into every template. */
export const CONTRACTS: ReadonlyArray<Contract> = [
  {
    title: "Database",
    description:
      "Drizzle schemas, migrations, typed queries. Postgres by default, swappable to any provider.",
    icon: "database",
    providers: [
      { name: "Postgres", logo: "postgresql" },
      { name: "Neon", logo: "neon" },
      { name: "Supabase", logo: "supabase" },
      { name: "Vercel", logo: "vercel" },
      { name: "Drizzle", logo: "drizzle" },
      { name: "Prisma", logo: "prisma" },
    ],
    mockup: "db-terminal",
  },
  {
    title: "Auth",
    description:
      "Sessions, organizations, invitations, OAuth. Typed against whichever provider you bring.",
    icon: "auth",
    providers: [
      { name: "Better Auth", logo: "betterauth" },
      { name: "Clerk", logo: "clerk" },
      { name: "Auth0", logo: "auth0" },
      { name: "Lucia", logo: "lucia" },
    ],
    mockup: "auth-form",
  },
  {
    title: "Billing",
    description:
      "Subscriptions, usage metering, webhooks. The shape your agent can already call.",
    icon: "billing",
    providers: [
      { name: "Stripe", logo: "stripe" },
      { name: "Resend", logo: "resend" },
    ],
    mockup: "billing-widget",
  },
  {
    title: "Jobs",
    description:
      "Queues, retries, dead-letter handling. Async work that does not block the request path.",
    icon: "jobs",
    providers: [
      { name: "Upstash", logo: "upstash" },
      { name: "Cloudflare", logo: "cloudflare" },
      { name: "Trigger.dev", logo: "triggerdotdev" },
      { name: "Inngest", logo: "inngest-missing" },
    ],
    mockup: "jobs-trace",
  },
  {
    title: "Storage",
    description:
      "Object storage with signed URLs and presigned uploads. Drop-in S3-compatible.",
    icon: "storage",
    providers: [
      { name: "Supabase", logo: "supabase" },
      { name: "Cloudflare", logo: "cloudflare" },
    ],
    mockup: "storage-browser",
  },
  {
    title: "Observability",
    description:
      "Logs, traces, metrics. The three signals that catch production issues.",
    icon: "observability",
    providers: [
      { name: "Sentry", logo: "sentry" },
      { name: "Better Stack", logo: "betterstack" },
    ],
    mockup: "otel-waterfall",
  },
  {
    title: "Cache",
    description:
      "KV stores, Redis-compatible. TTLs, namespacing, typed access. Drop-in for hot-path reads.",
    icon: "cache",
    providers: [
      { name: "Redis", logo: "redis" },
      { name: "Upstash", logo: "upstash" },
      { name: "Vercel KV", logo: "vercel" },
    ],
    mockup: "cache-keys",
  },
]

// ---------------------------------------------------------------------------
// Personas (Section 4: "Who it's for")
// ---------------------------------------------------------------------------

export type Persona = {
  slug: string
  label: string
  headline: string
  outcome: string
}

/** The four personas the registry explicitly serves. */
export const PERSONAS: ReadonlyArray<Persona> = [
  {
    slug: "indie-hackers",
    label: "Indie hackers",
    headline: "Ship your first $ online this weekend.",
    outcome:
      "From `deessejs init` to your first paying customer in days, not months.",
  },
  {
    slug: "saas-founders",
    label: "SaaS founders",
    headline: "Skip 10 weeks of infra.",
    outcome:
      "Reach your first paying customer in 30 days, with contracts you can extend instead of rewrite.",
  },
  {
    slug: "enterprise",
    label: "Enterprise teams",
    headline: "Stop rebuilding the same eight services.",
    outcome:
      "Skip the internal platform build. Use ours. Same contracts, same guarantees, same audit trail.",
  },
  {
    slug: "ai-native",
    label: "AI-native teams",
    headline: "Ship with your agent, not against it.",
    outcome:
      "Templates an agent reads as well as you do. Typed end-to-end, MCP-ready, no plumbing to invent.",
  },
]

// ---------------------------------------------------------------------------
// What you skip (Section 5)
// ---------------------------------------------------------------------------

export type SkipItem = { hours: string; label: string }

/**
 * Hour-counted plumbing the buyer does not have to repeat. Numbers are
 * internal estimates and stay approximate; they exist to make the
 * time-to-production metric legible to a non-engineer visitor.
 */
export const SKIP_ITEMS: ReadonlyArray<SkipItem> = [
  {
    hours: "40+ hrs",
    label: "Auth wired with orgs, invitations, OAuth, and 2FA",
  },
  {
    hours: "24+ hrs",
    label: "Stripe webhooks, subscriptions, customer portal, dunning",
  },
  {
    hours: "16+ hrs",
    label: "Drizzle schema, migrations, typed queries, RLS",
  },
  {
    hours: "12+ hrs",
    label: "Background jobs with retries, dead-letter, observability",
  },
  {
    hours: "8 hrs",
    label: "Email transport with DKIM, SPF, and DMARC",
  },
  {
    hours: "8 hrs",
    label: "Object storage with signed URLs and presigned uploads",
  },
  {
    hours: "8 hrs",
    label: "Observability with traces, logs, metrics, and dashboards",
  },
  {
    hours: "∞ hrs",
    label: "Overthinking the architecture",
  },
]

export const SKIP_TOTAL_HOURS = "124+"

// ---------------------------------------------------------------------------
// Integrations (Section 12)
// ---------------------------------------------------------------------------

export type IntegrationGroup = "frameworks" | "providers"

export type Integration = {
  name: string
  logo: string
  group: IntegrationGroup
}

/**
 * Logo wall: frameworks, providers, AI agents.
 *
 * Logo slugs match the simple-icons convention and resolve to
 * `/public/logos/<slug>.svg`. Each is rendered via `<IntegrationColumns>`,
 * which applies `dark:invert` so monochrome marks stay legible in dark
 * mode.
 *
 * SvelteKit was removed in this revision: simple-icons has no official
 * SvelteKit mark (only the parent Svelte one). Reusing the Svelte
 * mark would be visually deceptive — Svelte and SvelteKit are distinct.
 * A four-framework column reads as a more honest promise than five
 * with one fake logo.
 */
export const INTEGRATIONS: ReadonlyArray<Integration> = [
  { name: "Next.js", logo: "nextdotjs", group: "frameworks" },
  { name: "Astro",   logo: "astro",    group: "frameworks" },
  { name: "Vue",     logo: "vuedotjs", group: "frameworks" },
  { name: "React",   logo: "react",    group: "frameworks" },
  { name: "Vercel",      logo: "vercel",     group: "providers" },
  { name: "Supabase",    logo: "supabase",   group: "providers" },
  { name: "Neon",        logo: "neon",       group: "providers" },
  { name: "Cloudflare",  logo: "cloudflare", group: "providers" },
  { name: "Stripe",      logo: "stripe",     group: "providers" },
]

/**
 * Coding-agent compatibility wall — the 6 CLI harnesses the registry's
 * contracts work with. Distinct from INTEGRATIONS because agents are
 * *consumers* of the system (they read the contracts), not interchangeable
 * providers behind a contract. Mixing them in the same column conflated
 * "what alternative providers can I plug in" with "what tool can drive
 * the templates" — two separate questions that deserve their own sections.
 *
 * Renders as a 6-cell single row on lg (3-col on md, 2-col on mobile).
 */
export type CodingAgent = {
  name: string
  logo: string
  /**
   * Slug used to build the docs.deessejs.com/agents/<docsSlug> URL
   * rendered on each card. Lowercased display name. Each card links
   * to the agent-specific onboarding guide on the public docs site.
   */
  docsSlug: string
}

export const CODING_AGENTS: ReadonlyArray<CodingAgent> = [
  { name: "Claude Code", logo: "claudecode", docsSlug: "claude-code" },
  { name: "Codex",       logo: "codex",      docsSlug: "codex" },
  { name: "Pi",          logo: "pi",         docsSlug: "pi" },
  { name: "Cursor",      logo: "cursor",     docsSlug: "cursor" },
  { name: "Grok",        logo: "grok",       docsSlug: "grok" },
  { name: "OpenCode",    logo: "opencode",   docsSlug: "opencode" },
]

/**
 * Group keys ordered for the 3-column display (Frameworks, Providers,
 * AI agents). Pre-grouping here means the consumer does not have to
 * `.filter()` inline in the render.
 */
export const INTEGRATION_GROUP_LABELS: ReadonlyArray<{
  key: IntegrationGroup
  label: string
}> = [
  { key: "frameworks", label: "Frameworks" },
  { key: "providers", label: "Providers" },
]

// ---------------------------------------------------------------------------
// Tech stack (Section 1b: "Built with")
// ---------------------------------------------------------------------------

/**
 * Tech stack shown in the "Built with" strip. These are the providers,
 * libraries, and runtimes that ship wired into every DeesseJS template.
 */
export const TECH_STACK: ReadonlyArray<{ name: string; logo: string }> = [
  { name: "Next.js", logo: "vercel" },
  { name: "Better Auth", logo: "betterauth" },
  { name: "Drizzle", logo: "drizzle" },
  { name: "Stripe", logo: "stripe" },
  { name: "Postgres", logo: "postgresql" },
  { name: "Cloudflare", logo: "cloudflare" },
  { name: "Resend", logo: "resend" },
  { name: "OpenAI", logo: "openai" },
]

// ---------------------------------------------------------------------------
// Stats (Section 13)
// ---------------------------------------------------------------------------

export type Stat = { label: string; value: string }

/** Hard-coded tier-1 stats: refreshable via npm + GitHub API in a later PR. */
export const STATS: ReadonlyArray<Stat> = [
  { label: "npm downloads", value: "12K" },
  { label: "GitHub stars", value: "3.2K" },
  { label: "templates", value: "1" },
  { label: "license", value: "MIT" },
]
