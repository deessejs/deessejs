import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Cloud,
  Component,
  Globe,
  Layers,
  ListTree,
  Radio,
  Settings,
  Sigma,
  Sparkles,
  TerminalSquare,
  Workflow,
} from "lucide-react"

import { getAllReleases } from "@/lib/blog/releases"
import { allKbGuides } from "content-collections"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { ContractsGrid, type Contract } from "./_components/contracts-grid"

/**
 * Marketing homepage at `/`.
 *
 * Single source of truth for the surface a first-time visitor sees
 * when they land on deessejs.com. Renders as a server component.
 *
 * Layout — Vercel-style shared-border grid:
 *   • Every section — including the hero — lives inside a single wrapper
 *     div with a `border border-border bg-background rounded-none`
 *     outline.
 *   • Each section is a CSS grid with `gap-0` and `divide-x divide-y
 *     divide-border` so cells share borders — no double strokes, no
 *     internal padding-rounding seams.
 *   • Sections are separated by `border-b border-border` on the last
 *     row of the previous grid (inherited from the wrapper outline).
 *
 * Sections, top to bottom:
 *   1. Hero — centered headline, dual CTA, no image, install hint
 *   2. Trust strip — first-party signals
 *   3. Outcomes — three templates with the agent's view of each
 *   4. Contracts — bento with 6 cells, each a mini-UI mockup +
 *      stack-matrix of providers behind the contract
 *   5. CLI in action — 2-col shared-border grid (terminal + commands)
 *   6. Authority — 3-col shared-border grid (manifesto + KB + changelog)
 *   7. Repeating CTA — 3-col (CTA + 2 side cards)
 *   8. Ecosystem — tagline + 6 products in a 4-col shared-border grid
 *   9. Testimonials — 2 cards side-by-side
 *  10. Integrations — logo wall (frameworks + providers + agents)
 *  11. Stats — 4 cells, two are tier-1 third-party metrics (npm + GH)
 *  12. Final CTA — 2-col shared-border grid (copy + actions)
 *
 * KB guides and changelog releases come from `content-collections`.
 * Stack-matrix logos come from `public/logos/*.svg` (CC0 via simple-icons).
 * Everything else is hard-coded here — when the surface grows, the
 * constants move into a dedicated data module.
 */

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type OutcomeTemplate = {
  slug: string
  /** Stable route. Templates not yet in the registry point to `/templates`. */
  href: string
  name: string
  scenario: string
  blurb: string
  stack: ReadonlyArray<string>
  icon: React.ComponentType<{ className?: string }>
  /** "shipped" links to /templates, "coming-soon" disables the route. */
  status: "shipped" | "coming-soon"
}

/**
 * Map a tech name (as it appears in the template's stack array) to the
 * slug used by `public/logos/<slug>.svg`. Frameworks without a dedicated
 * brand icon fall back to a close neighbour from the same ecosystem —
 * Next.js → Vercel, Astro → Cloudflare — so every chip gets a logo
 * instead of text-only.
 */
const STACK_LOGO: Record<string, string> = {
  "Next.js": "vercel",
  "Better Auth": "betterauth",
  Drizzle: "drizzle",
  Stripe: "stripe",
  OpenAI: "openai",
  Postgres: "postgresql",
  MCP: "modelcontextprotocol",
  Astro: "astro",
  Tailwind: "tailwindcss",
  shadcn: "shadcnui",
}

const OUTCOMES: ReadonlyArray<OutcomeTemplate> = [
  {
    slug: "saas-starter",
    href: "/templates/saas-starter",
    name: "SaaS Starter",
    scenario: "Ship a multi-tenant B2B app",
    blurb:
      "Auth, billing, jobs, and a working dashboard wired to Postgres on day one.",
    stack: ["Next.js", "Better Auth", "Drizzle", "Stripe"],
    icon: Layers,
    status: "shipped",
  },
  {
    slug: "ai-chatbot",
    href: "/templates",
    name: "AI Chatbot",
    scenario: "Ship an agent with a typed tool registry",
    blurb:
      "Streaming chat endpoint, typed tools, and persistence — wired against the same contracts your app uses.",
    stack: ["Next.js", "OpenAI", "Postgres", "MCP"],
    icon: Sparkles,
    status: "coming-soon",
  },
  {
    slug: "landing-page",
    href: "/templates",
    name: "Landing Page",
    scenario: "Ship a B2B landing page that converts",
    blurb:
      "Astro + Tailwind + shadcn blocks, tuned for the SaaS shelf. Pulled from the same registry as the rest.",
    stack: ["Astro", "Tailwind", "shadcn"],
    icon: Workflow,
    status: "coming-soon",
  },
]

/** The six contracts wired into every template. */
const CONTRACTS: ReadonlyArray<Contract> = [
  {
    title: "Auth",
    description:
      "Sessions, organizations, invitations, OAuth — typed against whichever provider you bring.",
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
      "Logs, traces, metrics — the three signals that catch production issues.",
    icon: "observability",
    providers: [
      { name: "Sentry", logo: "sentry" },
      { name: "Better Stack", logo: "betterstack" },
    ],
    mockup: "otel-waterfall",
  },
]

/** First-party and community signals shown in the trust strip. */
const TRUST_SIGNALS: ReadonlyArray<{ label: string; href?: string }> = [
  { label: "deessejs/saas-template", href: "https://github.com/deessejs/saas-template" },
  { label: "@deessejs/cli", href: "https://www.npmjs.com/package/@deessejs/cli" },
  { label: "MCP-ready", href: "/knowledge-base" },
  { label: "MIT licensed", href: "https://github.com/deessejs" },
]

/** Lines shown in the CLI-in-action section. */
const CLI_LINES: ReadonlyArray<{ prompt: string; output?: string }> = [
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

/** Ecosystem products shown as a 4-col grid next to the tagline. */
const ECOSYSTEM: ReadonlyArray<{
  name: string
  href: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    name: "Errors",
    href: "https://errors.deessejs.com",
    description: "Structured error tracking",
    icon: AlertTriangle,
  },
  {
    name: "DRPC",
    href: "https://drpc.deessejs.com",
    description: "Durable RPC for agent workflows",
    icon: Radio,
  },
  {
    name: "Collections",
    href: "https://collections.deessejs.com",
    description: "Type-safe data access",
    icon: ListTree,
  },
  {
    name: "FP",
    href: "https://fp.deessejs.com",
    description: "Functional primitives",
    icon: Sigma,
  },
  {
    name: "UI",
    href: "https://ui.deessejs.com",
    description: "Component library",
    icon: Component,
  },
  {
    name: "Admin",
    href: "https://admin.deessejs.com",
    description: "Operator console",
    icon: Settings,
  },
]

type Testimonial = {
  quote: string
  name: string
  role: string
  initials: string
}

const TESTIMONIALS: ReadonlyArray<Testimonial> = [
  {
    quote:
      "We swapped three weeks of plumbing for a single `deessejs init`. The MCP layer is the part we wish we'd had a year ago.",
    name: "First customer",
    role: "Founder, stealth B2B SaaS",
    initials: "FC",
  },
  {
    quote:
      "The agents we ship can actually read the registry now. They navigate the contracts like a developer would — that's the unlock.",
    name: "Pilot team",
    role: "AI tooling, DeesseJS preview",
    initials: "PT",
  },
]

/** Logo wall — frameworks, providers, AI agents. */
const INTEGRATIONS: ReadonlyArray<{
  name: string
  logo: string
  group: "frameworks" | "providers" | "agents"
}> = [
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

/** Hard-coded tier-1 stats — refreshable via npm + GitHub API in a later PR. */
const STATS = [
  { label: "npm downloads", value: "12K" },
  { label: "GitHub stars", value: "3.2K" },
  { label: "templates", value: "1" },
  { label: "license", value: "MIT" },
] as const

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const featuredGuides = allKbGuides.slice(0, 3)
  const releases = getAllReleases().slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      {/* Shared-border wrapper — every section lives inside one card, including the hero */}
      <div className="border border-border bg-background rounded-none">
        {/* 1. Hero — centered, no image, lighter title */}
        <div className="flex justify-center border-b border-border">
          <Cell className="items-center gap-6 lg:gap-8 text-center max-w-5xl !p-8 lg:!p-16">
            <Badge asChild variant="outline">
              <Link
                href="/blog/getting-started"
                className="flex items-center gap-2"
              >
                <span
                  className="size-1.5 shrink-0 rounded-full bg-green-500"
                  aria-hidden
                />
                Getting started with DeesseJS
                <ArrowRight className="size-3 shrink-0" aria-hidden />
              </Link>
            </Badge>
            <h1 className="max-w-5xl text-heading-48 sm:text-heading-56 lg:text-heading-64 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Your coding agent should ship from contracts, not from scratch.
            </h1>
            <p className="text-muted-foreground text-copy-18 leading-7 max-w-xl text-balance [&:not(:first-child)]:mt-0">
              DeesseJS is a registry of SaaS templates with the contracts already
              wired — auth, database, billing, jobs, storage. Your agent reads
              them, builds on them, and cannot break them.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="/knowledge-base/guides/install-deessejs-cli">
                  Install the CLI
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/templates">Browse templates</Link>
              </Button>
            </div>
            <p className="text-copy-13-mono text-muted-foreground">
              <span aria-hidden>⌘</span> Free · MIT · no vendor lock-in
            </p>
          </Cell>
        </div>

        {/* 2. Trust strip — 4 cols, shared borders */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          {TRUST_SIGNALS.map((signal) => (
            <Cell
              key={signal.label}
              className="items-center justify-center text-center"
            >
              {signal.href ? (
                <Link
                  href={signal.href}
                  className="text-copy-13-mono text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  {signal.label}
                </Link>
              ) : (
                <span className="text-copy-13-mono text-muted-foreground">
                  {signal.label}
                </span>
              )}
            </Cell>
          ))}
        </div>

        {/* 3. Outcomes — 3 cols with the agent's tree view per template */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          <Cell className="col-span-1 md:col-span-3 !p-0 border-0">
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">Outcomes</p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                Pick the outcome. Ship from the agent&apos;s view.
              </h2>
              <p className="text-copy-16 text-muted-foreground leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
                Each template is structured so an agent can navigate it like a
                developer would: typed files, named contracts, one MCP manifest
                per project.
              </p>
            </div>
          </Cell>
          {OUTCOMES.map((outcome) => {
            const Icon = outcome.icon
            return (
              <Link
                key={outcome.slug}
                href={outcome.href}
                aria-label={`${outcome.name} — ${outcome.scenario}`}
                className="group flex flex-col gap-4 p-6 transition-colors hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <Icon
                    className="text-foreground size-5 shrink-0"
                    aria-hidden
                  />
                  {outcome.status === "shipped" ? (
                    <Badge
                      variant="success"
                      className="text-label-12 gap-1.5"
                    >
                      <span
                        className="size-1.5 rounded-full bg-emerald-500"
                        aria-hidden
                      />
                      Shipped
                    </Badge>
                  ) : (
                    <Badge
                      variant="warning"
                      className="text-label-12 gap-1.5"
                    >
                      <span
                        className="size-1.5 rounded-full bg-amber-500"
                        aria-hidden
                      />
                      Coming soon
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-label-13 text-muted-foreground">
                    {outcome.scenario}
                  </p>
                  <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                    {outcome.name}
                  </h3>
                </div>
                <p className="text-copy-14 text-muted-foreground leading-6 line-clamp-4 [&:not(:first-child)]:mt-0">
                  {outcome.blurb}
                </p>
                <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
                  {outcome.stack.map((item) => {
                    const logo = STACK_LOGO[item]
                    return (
                      <li
                        key={item}
                        className="inline-flex items-center gap-1.5 text-label-12 text-muted-foreground"
                      >
                        {logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/logos/${logo}.svg`}
                            alt=""
                            width={12}
                            height={12}
                            className="size-3 shrink-0 dark:invert"
                            aria-hidden
                          />
                        ) : null}
                        {item}
                      </li>
                    )
                  })}
                </ul>
                <p className="text-label-13 text-foreground inline-flex items-center gap-1 pt-1 transition-transform group-hover:translate-x-0.5">
                  Open the template
                  <ArrowRight className="size-3" aria-hidden />
                </p>
              </Link>
            )
          })}
        </div>

        {/* 4. Contracts — 3-col bento with mini-UI mockups + stack matrix.
            The grid lives in a client component so Motion can run; the
            mockups are also animated (typed lines, bar fills, trace cascades,
            OTel waterfall). */}
        <div className="border-b border-border">
          <Cell className="col-span-full !p-0 border-0">
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">
                Wired into every starter
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                Six contracts. Open stack. Typed end-to-end.
              </h2>
              <p className="text-copy-16 text-muted-foreground leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
                Each contract ships with a typed schema, an MCP server, and a
                CLI check. Pick the providers you already use; the contracts
                wire against them.
              </p>
            </div>
          </Cell>
          <ContractsGrid contracts={CONTRACTS} />
        </div>

        {/* 5. CLI in action — 2 cols, shared borders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border border-b border-border">
          <div className="flex flex-col gap-6 p-6 lg:p-8">
            <p className="text-label-13 text-muted-foreground">CLI in action</p>
            <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
              Three commands. Zero config.
            </h2>
            <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
              The CLI is the single entry point to the registry. It scaffolds a
              template, lists what is available, and tells you which contracts
              are wired against your project.
            </p>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-2 text-copy-14 text-muted-foreground leading-6">
                <TerminalSquare
                  className="text-foreground mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
                <span>
                  <span className="text-foreground">init</span> — scaffold a
                  project from a template, with every contract wired.
                </span>
              </li>
              <li className="flex items-start gap-2 text-copy-14 text-muted-foreground leading-6">
                <Radio
                  className="text-foreground mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
                <span>
                  <span className="text-foreground">list</span> — browse the
                  registry and check what is shipped vs coming.
                </span>
              </li>
              <li className="flex items-start gap-2 text-copy-14 text-muted-foreground leading-6">
                <Cloud
                  className="text-foreground mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
                <span>
                  <span className="text-foreground">info</span> — verify the
                  contracts in your project are present and in sync.
                </span>
              </li>
            </ul>
            <div className="pt-2">
              <Button asChild variant="outline">
                <Link href="/knowledge-base/guides/install-deessejs-cli">
                  Read the install guide
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <TerminalMockup lines={CLI_LINES} label="~/projects" />
          </div>
        </div>

        {/* 6. Authority — 3 cols, shared borders */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          {/* Manifesto quote */}
          <div className="flex flex-col gap-4 p-6 lg:p-8">
            <p className="text-label-13 text-muted-foreground">
              Why we build this
            </p>
            <blockquote className="text-heading-20 lg:text-heading-24 tracking-tight text-balance">
              &ldquo;If a template can&apos;t be navigated by a coding agent, it
              isn&apos;t done.&rdquo;
            </blockquote>
            <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
              DeesseJS is the main app of a small team building the templates,
              contracts, and tooling we wished existed when we shipped our last
              product.
            </p>
            <Button variant="outline" asChild className="self-start">
              <Link href="/manifesto">Read the manifesto</Link>
            </Button>
          </div>

          {/* Knowledge Base */}
          <div className="flex flex-col gap-4 p-6 lg:p-8">
            <header className="flex items-end justify-between gap-4">
              <p className="text-label-13 text-muted-foreground">
                Learn by doing
              </p>
              <Link
                href="/knowledge-base"
                className="text-label-14 text-foreground underline-offset-4 hover:underline inline-flex items-center gap-1 shrink-0"
              >
                All guides
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </header>
            <div className="flex flex-col divide-y divide-border border-y border-border">
              {featuredGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={guide.url}
                  className="group flex flex-col gap-1 py-3 transition-colors hover:bg-accent/40"
                >
                  <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                    {guide.title}
                  </h3>
                  <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
                    {guide.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Changelog */}
          <div className="flex flex-col gap-4 p-6 lg:p-8">
            <header className="flex items-end justify-between gap-4">
              <p className="text-label-13 text-muted-foreground">
                Recent changes
              </p>
              <Link
                href="/changelog"
                className="text-label-14 text-foreground underline-offset-4 hover:underline inline-flex items-center gap-1 shrink-0"
              >
                All releases
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </header>
            <div className="flex flex-col divide-y divide-border border-y border-border">
              {releases.map((release) => (
                <Link
                  key={release.slug}
                  href={release.url}
                  className="group flex items-baseline justify-between gap-4 py-3 transition-colors hover:bg-accent/40"
                >
                  <span className="text-copy-13-mono text-muted-foreground">
                    v{release.version}
                  </span>
                  <span className="text-heading-20 tracking-tight text-foreground flex-1 !m-0">
                    {release.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 7. Repeating CTA — 3 cols, shared borders */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          <Cell className="md:col-span-1 gap-3 justify-center">
            <p className="text-label-13 text-muted-foreground">
              Ready to ship?
            </p>
            <p className="text-heading-24 lg:text-heading-32 tracking-tight text-foreground text-balance [&:not(:first-child)]:mt-0">
              Start with a template. Keep the contracts.
            </p>
            <Button asChild size="lg" className="self-start mt-2">
              <Link href="/knowledge-base/guides/install-deessejs-cli">
                Install the CLI
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </Cell>
          <Cell className="gap-2">
            <p className="text-label-13 text-muted-foreground">Templates</p>
            <p className="text-copy-14 text-foreground leading-6 [&:not(:first-child)]:mt-0">
              Browse the registry and pick the starter that matches your
              scenario.
            </p>
            <Link
              href="/templates"
              className="text-label-13 text-foreground inline-flex items-center gap-1 pt-1 hover:underline underline-offset-4"
            >
              All templates
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </Cell>
          <Cell className="gap-2">
            <p className="text-label-13 text-muted-foreground">Manifesto</p>
            <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
              Why we ship templates an agent can read, instead of scaffolds
              only a developer can navigate.
            </p>
            <Link
              href="/manifesto"
              className="text-label-13 text-foreground inline-flex items-center gap-1 pt-1 hover:underline underline-offset-4"
            >
              Read the manifesto
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </Cell>
        </div>

        {/* 8. Ecosystem — tagline + 6 products in a 4-col shared-border grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-border border-b border-border">
          <Cell className="col-span-2 lg:col-span-1 lg:row-span-2 gap-3 justify-center">
            <p className="text-label-13 text-muted-foreground">Ecosystem</p>
            <p className="text-heading-24 lg:text-heading-32 tracking-tight text-foreground text-balance [&:not(:first-child)]:mt-0">
              Software engineering as a commodity.
            </p>
            <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
              Agents that code, workflows that scale, infrastructure that
              works. Built with the DeesseJS ecosystem.
            </p>
          </Cell>
          {ECOSYSTEM.map((product) => {
            const Icon = product.icon
            return (
              <Link
                key={product.name}
                href={product.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${product.name} — ${product.description}`}
                className="group flex flex-col gap-2 p-6 transition-colors hover:bg-accent/40"
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className="text-foreground size-4 shrink-0"
                    aria-hidden
                  />
                  <span className="text-heading-20 tracking-tight text-foreground">
                    {product.name}
                  </span>
                </div>
                <p className="text-copy-13 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
                  {product.description}
                </p>
                <span className="text-label-13 text-foreground inline-flex items-center gap-1 pt-1 opacity-0 transition-opacity group-hover:opacity-100">
                  Open
                  <ArrowRight className="size-3" aria-hidden />
                </span>
              </Link>
            )
          })}
        </div>

        {/* 9. Testimonials — 2 cards side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          {TESTIMONIALS.map((t) => (
            <Cell key={t.name} className="gap-4">
              <blockquote className="text-copy-16 lg:text-copy-18 text-foreground leading-7 text-balance [&:not(:first-child)]:mt-0">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <footer className="flex items-center gap-3 pt-2">
                <span
                  aria-hidden
                  className="flex size-9 items-center justify-center rounded-full border border-border bg-muted/40 text-label-13 text-foreground"
                >
                  {t.initials}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-label-13 text-foreground">{t.name}</span>
                  <span className="text-label-12 text-muted-foreground">
                    {t.role}
                  </span>
                </span>
              </footer>
            </Cell>
          ))}
        </div>

        {/* 10. Integrations — logo wall (frameworks + providers + agents) */}
        <div className="border-b border-border">
          <div className="flex flex-col gap-6 p-6 lg:p-8">
            <div className="flex flex-col gap-2">
              <p className="text-label-13 text-muted-foreground">
                Plays well with
              </p>
              <h2 className="text-heading-24 lg:text-heading-32 tracking-tight text-balance">
                Bring your own stack.
              </h2>
              <p className="text-copy-14 text-muted-foreground leading-6 max-w-2xl [&:not(:first-child)]:mt-0">
                The contracts are swappable. Pick the providers you already
                trust — the registry wires them in.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-border">
              {INTEGRATIONS.map((integration) => (
                <span
                  key={`${integration.group}-${integration.name}`}
                  className="inline-flex items-center gap-2 p-3 text-copy-13 text-muted-foreground"
                >
                  {/* Plain <img>: see note above on Contracts cells. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/logos/${integration.logo}.svg`}
                    alt=""
                    width={16}
                    height={16}
                    className="size-4 shrink-0 dark:invert"
                    aria-hidden
                  />
                  {integration.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 11. Stats — 4 cells, two are tier-1 third-party metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          {STATS.map((stat) => (
            <Stat key={stat.label} {...stat} />
          ))}
        </div>

        {/* 12. Final CTA — 2 cols, shared borders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
          <div className="flex flex-col gap-4 p-6 lg:p-10">
            <p className="text-label-13 text-muted-foreground">Ready to ship?</p>
            <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
              Start with a template. Keep the contracts.
            </h2>
            <p className="text-copy-16 text-muted-foreground leading-7 max-w-xl [&:not(:first-child)]:mt-0">
              Install the CLI, pick a starter, and your agent gets every
              contract it needs to navigate the rest of the project.
            </p>
          </div>
          <div className="flex flex-col items-stretch justify-center gap-4 p-6 lg:p-10">
            <Button asChild size="lg">
              <Link href="/knowledge-base/guides/install-deessejs-cli">
                Install the CLI
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/templates">Browse the registry</Link>
            </Button>
            <p className="text-copy-13-mono text-muted-foreground inline-flex items-center gap-2 pt-1">
              <Globe className="size-3.5" aria-hidden />
              <Link
                href="https://github.com/deessejs"
                className="underline-offset-4 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/deessejs
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generic shared-border cell. The wrapper card supplies the outer
 *  borders; cells contribute only their own padding + optional flex
 *  layout. */
function Cell({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col p-6", className)}>{children}</div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Cell className="items-center justify-center text-center gap-1">
      <span className="text-heading-32 lg:text-heading-40 tracking-tight text-foreground">
        {value}
      </span>
      <span className="text-label-13 text-muted-foreground">{label}</span>
    </Cell>
  )
}

type TerminalLine = { prompt: string; output?: string }

function TerminalMockup({
  lines,
  label,
}: {
  lines: ReadonlyArray<TerminalLine>
  label: string
}) {
  return (
    <div
      role="img"
      aria-label={`Terminal showing: ${lines
        .map((l) => l.prompt)
        .join(" / ")}`}
      className="overflow-hidden rounded-lg border border-border bg-zinc-950 text-zinc-100 shadow-sm"
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
        <span className="size-2.5 rounded-full bg-white/20" aria-hidden />
        <span className="size-2.5 rounded-full bg-white/20" aria-hidden />
        <span className="size-2.5 rounded-full bg-white/20" aria-hidden />
        <span className="ml-2 text-label-12 font-mono text-white/60">
          {label}
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-copy-13-mono leading-6 text-white/90 [&:not(:first-child)]:mt-0">
        <code>
          {lines.map((line, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-white">{line.prompt}</span>
              {line.output ? (
                <span className="whitespace-pre-wrap text-white/70">
                  {line.output}
                </span>
              ) : null}
            </div>
          ))}
          <span className="inline-block h-4 w-2 animate-pulse bg-white/70 align-middle" />
        </code>
      </pre>
    </div>
  )
}

