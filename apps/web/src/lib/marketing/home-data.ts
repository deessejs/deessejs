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

/** The six contracts wired into every template. */
export const CONTRACTS: ReadonlyArray<Contract> = [
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
]

// ---------------------------------------------------------------------------
// CLI in action (Section 7)
// ---------------------------------------------------------------------------

/** Lines shown in the CLI-in-action section. */
export const CLI_LINES: ReadonlyArray<{ prompt: string; output?: string }> = [
  {
    prompt: "$ npx deessejs init my-saas --template=saas-starter",
    output:
      "Cloning template…\nInstalling contracts (auth, db, billing, jobs, storage, obs)\nWiring Better Auth + Drizzle + Stripe\n✔ Project ready at ./my-saas",
  },
  {
    prompt: "$ npx deessejs list",
    output:
      "saas-starter        shipped    Next.js · Better Auth · Drizzle · Stripe\nai-chatbot          coming-soon\nlanding-page        coming-soon",
  },
  {
    prompt: "$ npx deessejs info my-saas",
    output:
      "6 contracts wired · 0 missing · 0 outdated\nMCP server: ready · 12 tools exposed",
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
      "From `npx deessejs init` to your first paying customer in days, not months.",
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

export type IntegrationGroup = "frameworks" | "providers" | "agents"

export type Integration = {
  name: string
  logo: string
  group: IntegrationGroup
}

/** Logo wall: frameworks, providers, AI agents. */
export const INTEGRATIONS: ReadonlyArray<Integration> = [
  { name: "Next.js", logo: "vercel", group: "frameworks" },
  { name: "Astro", logo: "cloudflare", group: "frameworks" },
  { name: "SvelteKit", logo: "cloudflare", group: "frameworks" },
  { name: "Vue", logo: "vercel", group: "frameworks" },
  { name: "React", logo: "vercel", group: "frameworks" },
  { name: "Vercel", logo: "vercel", group: "providers" },
  { name: "Supabase", logo: "supabase", group: "providers" },
  { name: "Neon", logo: "neon", group: "providers" },
  { name: "Cloudflare", logo: "cloudflare", group: "providers" },
  { name: "Stripe", logo: "stripe", group: "providers" },
  { name: "Anthropic", logo: "anthropic", group: "agents" },
  { name: "OpenAI", logo: "openai", group: "agents" },
  { name: "Hugging Face", logo: "huggingface", group: "agents" },
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
  { key: "agents", label: "AI agents" },
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
