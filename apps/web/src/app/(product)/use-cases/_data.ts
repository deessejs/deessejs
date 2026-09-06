/**
 * Single source of truth for use-case content.
 *
 * Hardcoded here for V1 — moves to a content source under
 * `apps/web/content/use-cases/` once the editorial pipeline ships.
 * Mirrors the forward-compatible shape used by /knowledge-base and
 * /templates.
 */
export type UseCaseMeta = {
  title: string
  tagline: string
  outcome: string
  /** Three short value props rendered in the "What you get" row. */
  features3: ReadonlyArray<{ title: string; value: string }>
  /** Three concrete deliverables rendered in the "What you ship" cards. */
  outcomes: ReadonlyArray<{
    name: string
    blurb: string
    status: "shipped" | "coming-soon"
  }>
  /** Pre-formatted ASCII art of the wiring. ~10-15 lines, mono-typed. */
  stackMap: string
  /** Tech labels for the "Built with" chip row. */
  stack: ReadonlyArray<string>
  starterSlug?: string
  /** Hero terminal command line. Falls back to `deessejs init`. */
  installCommand?: string
  /** Second line under the install command in the hero terminal. */
  installHint?: string
}

export const USE_CASES: Record<string, UseCaseMeta> = {
  "saas-apps": {
    title: "SaaS apps",
    tagline:
      "Multi-tenant B2B SaaS with auth, billing, and a working dashboard on day one.",
    outcome:
      "A production-grade SaaS starter — auth, billing, orgs, audit log, dashboard — that a team can take to market in days rather than months.",
    features3: [
      {
        title: "Wired for tenancy",
        value:
          "Org-scoped auth, role boundaries, and rate limits come pre-configured — not as a weekend project.",
      },
      {
        title: "Type-safe end to end",
        value:
          "Contracts shared between Next.js routes, server actions, and the worker queue. One source of truth.",
      },
      {
        title: "Ready to bill",
        value:
          "Stripe webhooks, plan upgrades, and customer portal flow ship with the template — no glue code.",
      },
    ],
    outcomes: [
      {
        name: "Multi-tenant auth",
        blurb:
          "Signup, login, password reset, and org switching with Better Auth — already wired to Drizzle.",
        status: "shipped",
      },
      {
        name: "Stripe billing webhooks",
        blurb:
          "Plan upgrades, downgrades, and customer portal flow with idempotent handlers.",
        status: "shipped",
      },
      {
        name: "Operator dashboard",
        blurb:
          "Admin console with audit log, bulk actions, and the same auth boundary as the customer app.",
        status: "shipped",
      },
    ],
    stackMap: `       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │  Next.js │───▶│  oRPC +  │───▶│ Postgres │
       └──────────┘    │  Drizzle │    └──────────┘
                       └──────────┘
                            │
                            ▼
                  ┌─────────────────────┐
                  │  Stripe · Resend ·  │
                  │  Better Auth        │
                  └─────────────────────┘`,
    stack: ["Next.js", "Better Auth", "Drizzle", "Postgres", "Stripe", "Resend"],
    starterSlug: "saas-starter",
    installCommand: "deessejs init saas-starter",
    installHint: "→ 47 files generated, ready in 60s",
  },
  "ai-products": {
    title: "AI products",
    tagline:
      "RAG, chat, and agents wired against the same contracts your app uses.",
    outcome:
      "An AI surface that streams responses, persists state, and exposes a typed tool registry — without glue code at every layer.",
    features3: [
      {
        title: "Streaming by default",
        value:
          "Server-sent events flow through the same typed contracts the rest of your app uses.",
      },
      {
        title: "Retrieval that stays in sync",
        value:
          "pgvector index updates on the same Drizzle migrations that update the rest of your schema.",
      },
      {
        title: "Tools your model can call",
        value:
          "Typed tool registry — your model calls functions with the same Zod schemas the UI uses.",
      },
    ],
    outcomes: [
      {
        name: "Streaming chat surface",
        blurb:
          "Token-by-token streaming with persistent conversation state and resumable sessions.",
        status: "shipped",
      },
      {
        name: "Typed tool registry",
        blurb:
          "Expose your app's actions to the model with the same contracts your UI consumes.",
        status: "shipped",
      },
      {
        name: "Vector retrieval",
        blurb:
          "pgvector with chunking, embedding, and re-ranking wired to your existing Postgres.",
        status: "shipped",
      },
    ],
    stackMap: `       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │  Next.js │───▶│  AI SDK  │───▶│  OpenAI  │
       └──────────┘    └──────────┘    └──────────┘
              │              │
              ▼              ▼
       ┌──────────┐    ┌──────────┐
       │ Postgres │◀──▶│ pgvector │
       │ (Drizzle)│    └──────────┘
       └──────────┘`,
    stack: ["Next.js", "AI SDK", "OpenAI", "pgvector", "Drizzle", "Resend"],
    starterSlug: "ai-chatbot",
    installCommand: "deessejs init ai-chatbot",
    installHint: "→ 38 files generated, ready in 60s",
  },
  "landing-pages": {
    title: "Landing pages",
    tagline:
      "High-converting marketing surfaces, tuned for the B2B SaaS shelf.",
    outcome:
      "A landing page that reads as a product, not a brochure — pricing matrix, feature grid, hero that earns the click.",
    features3: [
      {
        title: "Tuned for B2B",
        value:
          "Pricing tier matrix, feature grid, FAQ, and a hero that doesn't read like a stock template.",
      },
      {
        title: "Fast by default",
        value:
          "Astro islands ship only the JavaScript each section needs — sub-100ms TTFB on Vercel.",
      },
      {
        title: "shadcn blocks ready",
        value:
          "Hero, pricing, FAQ, and feature grid sections — copy them, edit them, ship.",
      },
    ],
    outcomes: [
      {
        name: "Pricing tier matrix",
        blurb:
          "Three-tier comparison with feature checkmarks and a highlighted recommended plan.",
        status: "shipped",
      },
      {
        name: "Feature grid",
        blurb:
          "Six-to-nine feature cards with icons, captions, and hover affordances.",
        status: "shipped",
      },
      {
        name: "FAQ accordion",
        blurb:
          "Objection-handling FAQ that ships collapsed and expands with smooth height transitions.",
        status: "shipped",
      },
    ],
    stackMap: `       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │   Astro  │───▶│ Tailwind │───▶│ shadcn   │
       │          │    │          │    │  blocks  │
       └──────────┘    └──────────┘    └──────────┘
              │
              ▼
       ┌──────────────────────────────┐
       │  Static-first · Islands     │
       │  · zero JS by default        │
       │  · partial hydration         │
       └──────────────────────────────┘`,
    stack: ["Astro", "Tailwind", "shadcn blocks"],
    starterSlug: "landing-page",
    installCommand: "deessejs init landing-page",
    installHint: "→ 22 files generated, ready in 30s",
  },
  "api-backends": {
    title: "API backends",
    tagline:
      "Service-only backends — Hono + oRPC, typed end to end, no frontend overhead.",
    outcome:
      "A pure HTTP API with type-safe RPC, contracts published for clients, and zero React in the dependency graph.",
    features3: [
      {
        title: "Pure typed RPC",
        value:
          "Hono routes import oRPC procedures — the wire format is the source of truth, not local types.",
      },
      {
        title: "No frontend in the graph",
        value:
          "Service-only deploy with no React, no Next.js, no client bundles. Edge-ready.",
      },
      {
        title: "Auth as middleware",
        value:
          "Better Auth handlers attached as Hono middleware — same auth the web app uses.",
      },
    ],
    outcomes: [
      {
        name: "Type-safe RPC layer",
        blurb:
          "oRPC procedures consumed by web, mobile, and partner clients from the same source.",
        status: "shipped",
      },
      {
        name: "Auth middleware",
        blurb:
          "Better Auth handlers attached to Hono routes — session lookup, role guards, rate limits.",
        status: "shipped",
      },
      {
        name: "Background job runner",
        blurb:
          "Queued jobs with retries, dead-letter handling, and the same observability as the rest.",
        status: "shipped",
      },
    ],
    stackMap: `   ┌────────┐   ┌────────┐   ┌────────────┐   ┌──────────┐
   │ Client │──▶│  Hono  │──▶│   oRPC     │──▶│ Drizzle  │──▶ Postgres
   └────────┘   └────────┘   │  contracts │   └──────────┘
        ▲                     └────────────┘
        │                           │
        └──── same auth middleware ─┘
                  (Better Auth)`,
    stack: ["Hono", "oRPC", "Drizzle", "Postgres", "Better Auth"],
    installCommand: "deessejs init api-backend",
    installHint: "→ 31 files generated, ready in 45s",
  },
  "internal-tools": {
    title: "Internal tools",
    tagline:
      "Admin dashboards and operator consoles that work behind SSO.",
    outcome:
      "Operator-facing surfaces with audit logs, bulk actions, and the same auth boundary as your customer app.",
    features3: [
      {
        title: "Same auth boundary",
        value:
          "Better Auth + the same org-scoped RBAC as the customer app. SSO-friendly.",
      },
      {
        title: "Tables that scale",
        value:
          "TanStack Table with server-side pagination, filtering, and column-level access control.",
      },
      {
        title: "Audit by default",
        value:
          "Every bulk action, role change, and config edit ships with a row in the audit log.",
      },
    ],
    outcomes: [
      {
        name: "Operator console",
        blurb:
          "Customer list, plan changes, impersonation, and bulk actions in a single UI.",
        status: "shipped",
      },
      {
        name: "Audit log",
        blurb:
          "Every mutation writes a row — who, what, when, with diff. Filterable and exportable.",
        status: "shipped",
      },
      {
        name: "RBAC matrix",
        blurb:
          "Role definitions, permission checks, and a UI to assign roles per org and per user.",
        status: "shipped",
      },
    ],
    stackMap: `       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │  Next.js │───▶│  Better  │───▶│ Postgres │
       │ (admin)  │    │   Auth   │    │ (shared) │
       └──────────┘    └──────────┘    └──────────┘
              │              │
              ▼              ▼
       ┌──────────┐    ┌──────────┐
       │ TanStack │    │  Audit   │
       │  Table   │    │   log    │
       └──────────┘    └──────────┘`,
    stack: ["Next.js", "Better Auth", "TanStack Table", "shadcn/ui", "Drizzle"],
    installCommand: "deessejs init internal-tool",
    installHint: "→ 34 files generated, ready in 50s",
  },
  "open-source": {
    title: "Open source",
    tagline:
      "Maintainer-friendly starters, MIT-licensed, versioned through the same registry.",
    outcome:
      "A starter your community can fork, install, and contribute back to — without inventing conventions from scratch.",
    features3: [
      {
        title: "MIT by default",
        value:
          "Every template ships under MIT. Fork it, change the name, ship to customers.",
      },
      {
        title: "Public roadmap",
        value:
          "Issues, milestones, and changelog entries flow through the same registry as closed-source work.",
      },
      {
        title: "CHANGELOG-driven releases",
        value:
          "Tagged versions on the registry follow the same release pipeline your team already uses.",
      },
    ],
    outcomes: [
      {
        name: "MIT-licensed starter",
        blurb:
          "LICENSE, README, and CONTRIBUTING files ship with every template — boring things, done right.",
        status: "shipped",
      },
      {
        name: "Registry publishing",
        blurb:
          "Add your template to the accepted-templates registry with a single CLI command.",
        status: "shipped",
      },
      {
        name: "Versioned releases",
        blurb:
          "Semver tags, changelogs, and migration notes follow your repo's own release flow.",
        status: "shipped",
      },
    ],
    stackMap: `   ┌────────────────────────────────────────────────────┐
   │                  Template repo                     │
   │   · LICENSE (MIT)                                  │
   │   · README.md                                      │
   │   · CONTRIBUTING.md                                │
   │   · src/  · tests/  · docs/                       │
   └────────────────────────────────────────────────────┘
                            │
                  deessejs init {slug}
                            │
                            ▼
   ┌────────────────────────────────────────────────────┐
   │            Accepted Templates Registry            │
   │   · semver tags   · changelog   · migration notes │
   └────────────────────────────────────────────────────┘`,
    stack: [
      "MIT license",
      "Public roadmap",
      "CHANGELOG-driven releases",
      "Accepted templates registry",
    ],
    installCommand: "deessejs init open-source-template",
    installHint: "→ 19 files generated, ready in 25s",
  },
  "mobile-backend": {
    title: "Mobile backend",
    tagline:
      "Auth, sync, and push notifications for native apps — without re-building what you already shipped.",
    outcome:
      "An open BaaS pattern that reuses your DeesseJS auth, contracts, and observability, even when the client is iOS or Android.",
    features3: [
      {
        title: "Same auth, same contracts",
        value:
          "Mobile clients consume the same oRPC surface the web app does. One source of truth.",
      },
      {
        title: "Sync without re-engineering",
        value:
          "Server-side state with conflict resolution — no Firebase, no Supabase, no new vendor.",
      },
      {
        title: "Push as a job",
        value:
          "Push notifications dispatch through the same queue the rest of your jobs use.",
      },
    ],
    outcomes: [
      {
        name: "Native auth bridge",
        blurb:
          "OAuth and email auth flows with the same Better Auth session shape your web app uses.",
        status: "shipped",
      },
      {
        name: "Sync endpoints",
        blurb:
          "Conflict-aware read/write endpoints with offline-first client helpers.",
        status: "shipped",
      },
      {
        name: "Push notifications",
        blurb:
          "APNs and FCM dispatchers wired to the same queue the rest of your background jobs use.",
        status: "shipped",
      },
    ],
    stackMap: `   ┌─────────┐   ┌──────────┐   ┌──────────┐
   │  iOS /  │──▶│   Hono  │──▶│ Postgres │
   │ Android │   │   + oRPC │   │ (shared) │
   └─────────┘   └──────────┘   └──────────┘
        ▲              │
        │              ▼
        │       ┌──────────────┐
        │       │ Push (APNs,  │
        └──────▶│   FCM) queue │
                └──────────────┘`,
    stack: ["Hono", "Better Auth", "Resend", "Expo (optional)"],
    installCommand: "deessejs init mobile-backend",
    installHint: "→ 28 files generated, ready in 40s",
  },
}

export const USE_CASE_SLUGS: ReadonlyArray<string> = Object.keys(USE_CASES)
