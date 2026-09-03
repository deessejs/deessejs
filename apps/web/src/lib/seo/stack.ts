/**
 * Single source of truth for the DeesseJS provider stack.
 *
 * Consumed by:
 *   - apps/web/src/app/(marketing)/stack/page.tsx (this page)
 *   - apps/web/src/lib/seo/stack-jsonld.ts (the ItemList JSON-LD)
 *
 * Each entry is a `Service` shape that the crawler graph can hang
 * off of. `name` is the public brand string, `role` is the function
 * the provider plays inside DeesseJS, `homepage` is the canonical
 * external URL (used for outbound `rel="noopener noreferrer"` links
 * and for the JSON-LD `url`), and `logo` is the slug under
 * `apps/web/public/logos/<slug>.svg`. The `blurb` is what we use
 * the provider for in this codebase — factual, no marketing
 * language, matching the site's editorial voice.
 *
 * `slug` is the URL fragment anchor for the deep-link on /stack
 * (#stack-vercel, #stack-neon, ...). Stable, lowercase, kebab-case.
 */

export type StackCategory =
  | "hosting"
  | "database"
  | "auth"
  | "queue"
  | "billing"
  | "observability"
  | "email"
  | "orm"

export type StackProvider = {
  name: string
  slug: string
  category: StackCategory
  role: string
  blurb: string
  homepage: string
  logo: string
}

export const STACK_PROVIDERS: ReadonlyArray<StackProvider> = [
  {
    name: "Vercel",
    slug: "vercel",
    category: "hosting",
    role: "Hosting platform",
    blurb:
      "Default deploy target for DeesseJS apps. Preview environments per PR, production environments on main, and the cross-project preview links that bind apps/web to apps/app.",
    homepage: "https://vercel.com",
    logo: "vercel",
  },
  {
    name: "Neon",
    slug: "neon",
    category: "database",
    role: "Managed Postgres",
    blurb:
      "Serverless Postgres we point the database package at for production deployments. Branches map to preview environments, autoscaling matches the request path.",
    homepage: "https://neon.tech",
    logo: "neon",
  },
  {
    name: "Supabase",
    slug: "supabase",
    category: "database",
    role: "Postgres + storage",
    blurb:
      "Postgres plus object storage with signed URLs and presigned uploads. Drop-in alongside Drizzle when the contract needs object storage rather than a relational row.",
    homepage: "https://supabase.com",
    logo: "supabase",
  },
  {
    name: "Better Auth",
    slug: "better-auth",
    category: "auth",
    role: "Authentication",
    blurb:
      "Auth surface for every DeesseJS app. Email and password, OAuth providers, organizations and invitations, session cookies, and the email-verification flow.",
    homepage: "https://www.better-auth.com",
    logo: "betterauth",
  },
  {
    name: "Upstash",
    slug: "upstash",
    category: "queue",
    role: "Queue substrate",
    blurb:
      "Queues and rate limiting. The async work that does not belong in the request path runs through Upstash workers, with retries and dead-letter handling built in.",
    homepage: "https://upstash.com",
    logo: "upstash",
  },
  {
    name: "Stripe",
    slug: "stripe",
    category: "billing",
    role: "Payments and subscriptions",
    blurb:
      "Subscriptions, usage metering, and webhook handlers. The Pro templates wire against Stripe and ship with a typed contracts layer on top of the SDK.",
    homepage: "https://stripe.com",
    logo: "stripe",
  },
  {
    name: "Sentry",
    slug: "sentry",
    category: "observability",
    role: "Error tracking",
    blurb:
      "Error tracking on the runtime. Stack traces, release tagging, and source-map upload are wired through @workspace/observability for every Next.js route.",
    homepage: "https://sentry.io",
    logo: "sentry",
  },
  {
    name: "Resend",
    slug: "resend",
    category: "email",
    role: "Transactional email",
    blurb:
      "Transactional email for signup confirmations, password resets, and billing notifications. The Pro templates use Resend for the templates the app sends itself.",
    homepage: "https://resend.com",
    logo: "resend",
  },
  {
    name: "Cloudflare",
    slug: "cloudflare",
    category: "hosting",
    role: "Edge and DNS",
    blurb:
      "DNS, edge caching, and queue workers via Cloudflare Queues. Used where the request path benefits from running at the edge rather than the origin.",
    homepage: "https://www.cloudflare.com",
    logo: "cloudflare",
  },
  {
    name: "Drizzle",
    slug: "drizzle",
    category: "orm",
    role: "Type-safe ORM",
    blurb:
      "Type-safe schema, migrations, and queries. Generates the SQL migrations the CI pipeline runs before the deploy hits, with separate rollback files for destructive changes.",
    homepage: "https://orm.drizzle.team",
    logo: "drizzle",
  },
  {
    name: "Postgres",
    slug: "postgres",
    category: "database",
    role: "Relational database",
    blurb:
      "The relational substrate every DeesseJS app assumes. Drizzle is the typed layer; Neon, Supabase, or a local container provide the actual database server.",
    homepage: "https://www.postgresql.org",
    logo: "postgresql",
  },
] as const

export const STACK_CATEGORY_LABELS: Record<StackCategory, string> = {
  hosting: "Hosting",
  database: "Database",
  auth: "Auth",
  queue: "Queue",
  billing: "Billing",
  observability: "Observability",
  email: "Email",
  orm: "ORM",
}

export const STACK_CATEGORY_ORDER: ReadonlyArray<StackCategory> = [
  "hosting",
  "database",
  "auth",
  "queue",
  "billing",
  "observability",
  "email",
  "orm",
]