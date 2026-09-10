import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Cloud,
  Code2,
  Component,
  Globe,
  Layers,
  ListTree,
  MonitorSmartphone,
  Radio,
  Settings,
  ShoppingBag,
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
import { CopyCommand } from "./_components/copy-command"
import { FlickeringGrid } from "./_components/flickering-grid"
import { TechStackGrid } from "./_components/tech-stack-grid"
import { TerminalMockup } from "./_components/terminal-mockup"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

/**
 * Marketing homepage at `/`.
 *
 * Single source of truth for the surface a first-time visitor sees
 * when they land on deessejs.com. Renders as a server component.
 *
 * Layout: Vercel-style shared-border grid:
 *   • Every section, including the hero, lives inside a single wrapper
 *     div with a `border border-border bg-background rounded-none`
 *     outline.
 *   • Each section is a CSS grid with `gap-0` and `divide-x divide-y
 *     divide-border` so cells share borders: no double strokes, no
 *     internal padding-rounding seams.
 *   • Sections are separated by `border-b border-border` on the last
 *     row of the previous grid (inherited from the wrapper outline).
 *
 * Sections, top to bottom:
 *   1. Hero: centered headline, three CTAs (install / ship / browse)
 *   1b. Built with: copy left, logo wall right (4-col grid)
 *   2. Surfaces: 4-col grid enumerating the 8 surfaces the registry covers
 *   4. Who it's for: 4-cell persona grid (indie / founder / enterprise / AI-native)
 *   5. What you skip: hour-counted list of plumbing you don't repeat
 *   6. Contracts: bento with 6 cells, each a mini-UI mockup +
 *      stack-matrix of providers behind the contract
 *   7. CLI in action: 2-col shared-border grid (terminal + commands)
 *   8. Authority: 3-col shared-border grid (manifesto + KB + changelog)
 *   9. Repeating CTA: 3-col with both columns (install / ship / manifesto)
 *  10. Ecosystem: tagline + 6 products in a 4-col shared-border grid
 *  11. Testimonials: 2 cards side-by-side
 *  12. Integrations: logo wall (frameworks + providers + agents)
 *  13. Stats: 4 cells, two are tier-1 third-party metrics (npm + GH)
 *  14. FAQ: 2/4 split, accordion of common questions
 *  15. Final CTA: 2-col shared-border grid carrying both columns (install / ship)
 *
 * KB guides and changelog releases come from `content-collections`.
 * Stack-matrix logos come from `public/logos/*.svg` (CC0 via simple-icons).
 * Everything else is hard-coded here. When the surface grows, the
 * constants move into a dedicated data module.
 *
 * Positioning rationale: see
 * `apps/internal-documentation/content/docs/(root)/home-positioning-strategy.mdx`.
 */

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type Surface = {
  slug: string
  name: string
  /** One-line description of what kind of project this surface targets. */
  blurb: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  status: "shipped" | "coming-soon"
}

/**
 * The eight surfaces the registry covers. Surfaces are not templates:
 * each surface is a category that may contain one or more templates.
 * The list is deliberately wider than what is shipped today: it tells
 * every visitor that the registry probably has something for them,
 * and lets them verify in one click.
 */
const SURFACES: ReadonlyArray<Surface> = [
  {
    slug: "saas",
    name: "SaaS",
    blurb: "Multi-tenant B2B apps with auth, billing, and orgs wired.",
    href: "/templates?surface=saas",
    icon: Layers,
    status: "shipped",
  },
  {
    slug: "ai-agents",
    name: "AI agents",
    blurb: "Streaming chat endpoints, typed tools, and agent persistence.",
    href: "/templates?surface=ai-agents",
    icon: Sparkles,
    status: "coming-soon",
  },
  {
    slug: "mobile",
    name: "Mobile",
    blurb: "React Native + Expo with the same contracts as the web stack.",
    href: "/templates?surface=mobile",
    icon: MonitorSmartphone,
    status: "coming-soon",
  },
  {
    slug: "desktop",
    name: "Desktop",
    blurb: "Electron or Tauri shells wired against the shared backend.",
    href: "/templates?surface=desktop",
    icon: Boxes,
    status: "coming-soon",
  },
  {
    slug: "clis",
    name: "CLIs",
    blurb: "Tool scaffolding that extends the same registry the web uses.",
    href: "/templates?surface=clis",
    icon: TerminalSquare,
    status: "coming-soon",
  },
  {
    slug: "apis",
    name: "APIs",
    blurb: "Standalone backends with oRPC, Hono, and typed contracts.",
    href: "/templates?surface=apis",
    icon: Workflow,
    status: "coming-soon",
  },
  {
    slug: "blogs",
    name: "Blogs",
    blurb: "MDX-driven content sites with i18n and structured data.",
    href: "/templates?surface=blogs",
    icon: Code2,
    status: "coming-soon",
  },
  {
    slug: "ecommerce",
    name: "E-commerce",
    blurb: "Storefronts with Stripe Checkout, inventory, and order webhooks.",
    href: "/templates?surface=ecommerce",
    icon: ShoppingBag,
    status: "coming-soon",
  },
]

/** The six contracts wired into every template. */
const CONTRACTS: ReadonlyArray<Contract> = [
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

/** The four personas the registry explicitly serves. */
type Persona = {
  slug: string
  label: string
  headline: string
  outcome: string
}

const PERSONAS: ReadonlyArray<Persona> = [
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

/**
 * Hour-counted plumbing the buyer does not have to repeat. Numbers are
 * internal estimates and stay approximate; they exist to make the
 * time-to-production metric legible to a non-engineer visitor.
 */
type SkipItem = { hours: string; label: string }

const SKIP_ITEMS: ReadonlyArray<SkipItem> = [
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

const SKIP_TOTAL_HOURS = "124+"

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
    description:
      "Structured error tracking with full TypeScript context. Stack traces, breadcrumbs, and source maps wired into the same contracts your templates use.",
    icon: AlertTriangle,
  },
  {
    name: "DRPC",
    href: "https://drpc.deessejs.com",
    description:
      "Durable RPC for agent workflows. Long-running calls that survive restarts, with retries and replay built in.",
    icon: Radio,
  },
  {
    name: "Collections",
    href: "https://collections.deessejs.com",
    description:
      "Type-safe data access with end-to-end inference. The schema is the source of truth, from the database to the client component.",
    icon: ListTree,
  },
  {
    name: "FP",
    href: "https://fp.deessejs.com",
    description:
      "Functional primitives for TypeScript. Pipes, options, results, and tasks, designed to keep the contracts readable under load.",
    icon: Sigma,
  },
  {
    name: "UI",
    href: "https://ui.deessejs.com",
    description:
      "Component library on top of shadcn. The same primitives every DeesseJS template ships with, extracted as a public package.",
    icon: Component,
  },
  {
    name: "Admin",
    href: "https://admin.deessejs.com",
    description:
      "Operator console for production teams. One dashboard for deployments, incidents, customers, and billing across every template.",
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
      "The agents we ship can actually read the registry now. They navigate the contracts like a developer would. That is the unlock.",
    name: "Pilot team",
    role: "AI tooling, DeesseJS preview",
    initials: "PT",
  },
]

/** Logo wall: frameworks, providers, AI agents. */
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

/**
 * Tech stack shown in the "Built with" strip. These are the providers,
 * libraries, and runtimes that ship wired into every DeesseJS template.
 */
const TECH_STACK: ReadonlyArray<{ name: string; logo: string }> = [
  { name: "Next.js", logo: "vercel" },
  { name: "Better Auth", logo: "betterauth" },
  { name: "Drizzle", logo: "drizzle" },
  { name: "Stripe", logo: "stripe" },
  { name: "Postgres", logo: "postgresql" },
  { name: "Cloudflare", logo: "cloudflare" },
  { name: "Resend", logo: "resend" },
  { name: "OpenAI", logo: "openai" },
]

/** Hard-coded tier-1 stats: refreshable via npm + GitHub API in a later PR. */
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
      {/* Shared-border wrapper: every section lives inside one card, including the hero */}
      <div className="border border-border bg-background rounded-none">
        {/* 1. Hero: centered, no image, two CTAs (install / ship) */}
        <div className="relative flex justify-center border-b border-border overflow-hidden">
          <FlickeringGrid
            className="absolute inset-0 z-0 opacity-60"
            squareSize={3}
            gridGap={5}
            flickerChance={0.15}
            maxOpacity={0.18}
            color="rgb(120, 120, 120)"
          />
          <Cell className="relative z-10 items-center gap-6 lg:gap-8 text-center max-w-5xl min-h-[560px] lg:min-h-[640px] !p-8 lg:!p-16">
            <Link
              href="/blog/getting-started"
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 shadow-sm transition-colors hover:bg-accent/40"
            >
              <Layers
                className="text-foreground size-4 shrink-0"
                aria-hidden
              />
              <span className="truncate text-sm font-normal text-foreground">
                Introducing intelligent code generation
              </span>
              <ArrowRight
                className="size-3 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </Link>
            <h1 className="max-w-5xl text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              The registry for production-grade templates your agent can ship from.
            </h1>
            <p className="text-muted-foreground text-copy-18 leading-7 max-w-xl text-balance [&:not(:first-child)]:mt-0">
              Senior patterns. Modern stack. The shortest path from{" "}
              <span className="font-mono text-foreground/90">
                npx deessejs init
              </span>{" "}
              to a deployed app.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="/templates">
                  Browse templates
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="bg-background hover:bg-accent/40">
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
            <CopyCommand command="npx @deessejs/cli@latest help" className="mt-2" />
          </Cell>
        </div>

        {/* 1b. Built with: copy left, logo wall right (4-col grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-2 justify-center p-6 md:p-8 lg:p-10">
            <p className="text-label-13 text-muted-foreground">
              Built with
            </p>
            <p className="text-heading-24 lg:text-heading-32 tracking-tighter text-balance [&:not(:first-child)]:mt-0">
              The stack senior engineers ship on.
            </p>
          </div>
          <TechStackGrid techs={TECH_STACK} />
        </div>

        {/* 2. Surfaces: 4-col grid enumerating the 8 surfaces the registry covers */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          <Cell className="col-span-2 md:col-span-4 !p-0 border-0">
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">Surfaces</p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                Pick the surface. Get the convention.
              </h2>
              <p className="text-copy-16 text-muted-foreground leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
                Eight surfaces, one registry. Each surface ships with the
                same contracts, the same patterns, and the same guarantees,
                whether you build it yourself or ship with us.
              </p>
            </div>
          </Cell>
          {SURFACES.map((surface) => {
            const Icon = surface.icon
            return (
              <div
                key={surface.slug}
                className="group transition-colors hover:bg-accent/40 md:[&:nth-child(n+6)]:border-t md:border-t-border"
              >
                <Link
                  href={surface.href}
                  aria-label={`${surface.name}: ${surface.blurb}`}
                  className="flex flex-col gap-3 p-6"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Icon
                      className="text-foreground size-5 shrink-0"
                      aria-hidden
                    />
                    {surface.status === "shipped" ? (
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
                  <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                    {surface.name}
                  </h3>
                  <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
                    {surface.blurb}
                  </p>
                </Link>
              </div>
            )
          })}
          <Cell className="col-span-2 md:col-span-4 !p-0 border-0">
            <div className="flex items-center justify-end gap-1 p-4 border-t border-border">
              <Link
                href="/templates"
                className="text-label-13 text-foreground inline-flex items-center gap-1 hover:underline underline-offset-4"
              >
                Browse all 8 surfaces
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </div>
          </Cell>
        </div>

        {/* 4. Who it's for: 4-cell persona grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          <Cell className="col-span-1 md:col-span-2 lg:col-span-4 !p-0 border-0">
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">Who it&apos;s for</p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                The same registry. Four doors in.
              </h2>
            </div>
          </Cell>
          {PERSONAS.map((persona) => (
            <Link
              key={persona.slug}
              href={`/solutions/${persona.slug}`}
              aria-label={`${persona.label}: ${persona.headline}`}
              className="group flex flex-col transition-colors hover:bg-accent/40"
            >
              <p className="text-label-13 text-muted-foreground p-6 pb-0">
                {persona.label}
              </p>
              <h3 className="text-heading-20 tracking-tight text-foreground !m-0 px-6 pt-2">
                {persona.headline}
              </h3>
              <p className="text-copy-14 text-muted-foreground leading-6 px-6 pt-2 flex-1 [&:not(:first-child)]:mt-0">
                {persona.outcome}
              </p>
              <p className="text-label-13 text-foreground inline-flex items-center gap-1 px-6 pt-2 pb-6">
                Learn more
                <ArrowRight className="size-3" aria-hidden />
              </p>
            </Link>
          ))}
        </div>

        {/* 5. What you skip: hour-counted list of plumbing you don't repeat */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border border-b border-border">
          <div className="flex flex-col gap-4 p-6 lg:p-8">
            <p className="text-label-13 text-muted-foreground">What you skip</p>
            <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
              {SKIP_TOTAL_HOURS} hours of plumbing you don&apos;t have to repeat.
            </h2>
            <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
              Every template ships with the integrations, the configurations,
              and the trade-offs already made. You start at the next problem,
              not at the same one.
            </p>
            <Button variant="outline" asChild className="self-start">
              <Link href="/blog/time-to-production">
                See the math
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </div>
          <ul className="flex flex-col divide-y divide-border">
            {SKIP_ITEMS.map((item) => (
              <li
                key={item.label}
                className="flex items-baseline gap-4 px-6 py-3 lg:px-8"
              >
                <span className="text-copy-13-mono text-foreground shrink-0 w-20">
                  {item.hours}
                </span>
                <span className="text-copy-14 text-muted-foreground leading-6">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 6. Contracts: 3-col bento with mini-UI mockups + stack matrix.
            The grid lives in a client component so Motion can run; the
            mockups are also animated (typed lines, bar fills, trace cascades,
            OTel waterfall). */}
        <div className="border-b border-border">
          <Cell className="col-span-full !p-0 border-0">
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">
                Under the hood
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                Six contracts. Open stack. Typed end-to-end.
              </h2>
              <p className="text-copy-16 text-muted-foreground leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
                Auth, database, billing, jobs, storage, observability. Typed
                against whichever provider you bring. The contracts your agent
                reads. The integration you don&apos;t have to write.
              </p>
            </div>
          </Cell>
          <ContractsGrid contracts={CONTRACTS} />
        </div>

        {/* 7. CLI in action: 2 cols, shared borders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border border-b border-border">
          <div className="flex flex-col gap-6 p-6 lg:p-8">
            <p className="text-label-13 text-muted-foreground">The entry point</p>
            <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
              Three commands. Production-ready in one.
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
                  <span className="text-foreground">init</span> scaffolds a
                  project from a template, with every contract wired.
                </span>
              </li>
              <li className="flex items-start gap-2 text-copy-14 text-muted-foreground leading-6">
                <Radio
                  className="text-foreground mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
                <span>
                  <span className="text-foreground">list</span> browses the
                  registry and check what is shipped vs coming.
                </span>
              </li>
              <li className="flex items-start gap-2 text-copy-14 text-muted-foreground leading-6">
                <Cloud
                  className="text-foreground mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
                <span>
                  <span className="text-foreground">info</span> verifies the
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
            <TerminalMockup
              lines={CLI_LINES}
              label="~/projects"
              className="text-sm leading-6"
            />
          </div>
        </div>

        {/* 8. Authority: 3 cols, shared borders */}
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

        {/* 9. Repeating CTA: 3 cols, both columns (install / ship / manifesto) */}
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
            <p className="text-label-13 text-muted-foreground">
              Want us to ship it?
            </p>
            <p className="text-copy-14 text-foreground leading-6 [&:not(:first-child)]:mt-0">
              Same templates, same contracts. We run the build with you, you
              ship to your customers.
            </p>
            <Link
              href="/delivery"
              className="text-label-13 text-foreground inline-flex items-center gap-1 pt-1 hover:underline underline-offset-4"
            >
              Talk to delivery
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

        {/* 10. Ecosystem: tagline + 6 products in a 4-col shared-border grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-border border-b border-border">
          <Cell className="col-span-2 lg:col-span-1 lg:row-span-2 gap-3 justify-center">
            <p className="text-label-13 text-muted-foreground">Ecosystem</p>
            <p className="text-heading-24 lg:text-heading-32 tracking-tight text-foreground text-balance [&:not(:first-child)]:mt-0">
              Six tools. One stack.
            </p>
            <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
              Built on the same contracts you ship on. Errors, RPC,
              collections, FP, UI, and the operator console. All DeesseJS.
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
                aria-label={`${product.name}: ${product.description}`}
                className="group flex flex-col gap-2 p-6 h-full transition-colors hover:bg-accent/40"
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
                <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
                  {product.description}
                </p>
              </Link>
            )
          })}
        </div>

        {/* 11. Testimonials: 2 cards side-by-side */}
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

        {/* 12. Integrations: logo wall grouped by category */}
        <div className="border-b border-border">
          <div className="flex flex-col gap-8 p-6 lg:p-8">
            <div className="flex flex-col gap-2">
              <p className="text-label-13 text-muted-foreground">
                Plays well with
              </p>
              <h2 className="text-heading-24 lg:text-heading-32 tracking-tight text-balance">
                Bring your own providers.
              </h2>
              <p className="text-copy-14 text-muted-foreground leading-6 max-w-2xl [&:not(:first-child)]:mt-0">
                The contracts consume whichever providers you trust. Swap
                Stripe for Lemon Squeezy, Upstash for Trigger.dev, Sentry for
                Better Stack. The interface does not change.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border divide-y divide-border md:divide-y-0 md:divide-x">
              {(
                [
                  { key: "frameworks", label: "Frameworks" },
                  { key: "providers", label: "Providers" },
                  { key: "agents", label: "AI agents" },
                ] as const
              ).map((category) => (
                <div
                  key={category.key}
                  className="flex flex-col gap-4 p-5 lg:p-6"
                >
                  <p className="text-label-13 text-muted-foreground uppercase tracking-wide">
                    {category.label}
                  </p>
                  <ul className="flex flex-col gap-3">
                    {INTEGRATIONS.filter((i) => i.group === category.key).map(
                      (integration) => (
                        <li
                          key={`${integration.group}-${integration.name}`}
                          className="inline-flex items-center gap-3 text-copy-14 text-foreground"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/logos/${integration.logo}.svg`}
                            alt=""
                            width={20}
                            height={20}
                            className="size-5 shrink-0 dark:invert"
                            aria-hidden
                          />
                          {integration.name}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 13. Stats: 4 cells, two are tier-1 third-party metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          {STATS.map((stat) => (
            <Stat key={stat.label} {...stat} />
          ))}
        </div>

        {/* 14. FAQ: 2/4 split with accordion */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-4 p-6 md:p-8 lg:p-12">
            <h2 className="text-heading-32 lg:text-heading-40 tracking-tighter text-balance">
              Frequently asked questions.
            </h2>
            <p className="text-muted-foreground text-copy-14 leading-6 text-balance">
              Answers to common questions about the registry, the contracts, and
              shipping with us. If you have any other questions, please reach
              out.
            </p>
          </div>
          <div className="col-span-1 lg:col-span-4 p-6 md:p-8 lg:p-12">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is-deessejs" className="last:border-b-0 border-b border-border py-4 first:pt-0">
                <AccordionTrigger className="text-left no-underline hover:no-underline py-0 text-base font-medium">
                  What is DeesseJS?
                </AccordionTrigger>
                <AccordionContent>
                  DeesseJS is a registry of production-grade templates for SaaS,
                  AI agents, mobile, desktop, CLIs, APIs, blogs, and e-commerce.
                  Each template ships with the same six contracts wired (auth,
                  database, billing, jobs, storage, observability) and the same
                  AI-friendly conventions so a coding agent can extend it
                  without re-discovering the boilerplate.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="is-deessejs-free" className="last:border-b-0 border-b border-border py-4 first:pt-0">
                <AccordionTrigger className="text-left no-underline hover:no-underline py-0 text-base font-medium">
                  Is DeesseJS free to use?
                </AccordionTrigger>
                <AccordionContent>
                  The templates and the CLI are MIT-licensed and free. Install
                  any template, modify it, ship it as your product. The
                  delivery service (we ship it with you) is a paid engagement
                  scoped per project. Contact us for a quote.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="how-it-works" className="last:border-b-0 border-b border-border py-4 first:pt-0">
                <AccordionTrigger className="text-left no-underline hover:no-underline py-0 text-base font-medium">
                  How does the CLI work?
                </AccordionTrigger>
                <AccordionContent>
                  Run <span className="font-mono text-foreground/90">npx @deessejs/cli@latest init my-project --template=saas-starter</span>{" "}
                  to scaffold a new project with every contract pre-wired. Use{" "}
                  <span className="font-mono text-foreground/90">list</span> to
                  browse the registry and{" "}
                  <span className="font-mono text-foreground/90">info</span> to
                  verify the contracts in your project are present and in
                  sync.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="ai-first" className="last:border-b-0 border-b border-border py-4 first:pt-0">
                <AccordionTrigger className="text-left no-underline hover:no-underline py-0 text-base font-medium">
                  What does AI-first actually mean?
                </AccordionTrigger>
                <AccordionContent>
                  Every template ships with an AGENTS.md file at the monorepo
                  root, an MCP manifest exposing the project tools, typed
                  contracts end-to-end, and a layout an agent can navigate
                  without guessing. Your coding agent reads the contracts,
                  builds on them, and cannot break them.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="ship-with-us" className="last:border-b-0 border-b border-border py-4 first:pt-0">
                <AccordionTrigger className="text-left no-underline hover:no-underline py-0 text-base font-medium">
                  What does &ldquo;ship with us&rdquo; mean?
                </AccordionTrigger>
                <AccordionContent>
                  Same templates, same contracts, same guarantees as the
                  self-service path, applied to a specific customer outcome.
                  Our delivery team runs the build with you, you ship to your
                  customers. You keep the code and the contracts at the end.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="lock-in" className="last:border-b-0 border-b border-border py-4 first:pt-0">
                <AccordionTrigger className="text-left no-underline hover:no-underline py-0 text-base font-medium">
                  Is there vendor lock-in?
                </AccordionTrigger>
                <AccordionContent>
                  No. Every template is MIT-licensed and self-hosted. The
                  contracts are interface-only: swap Stripe for Lemon Squeezy,
                  Upstash for Trigger.dev, Sentry for Better Stack without
                  changing your code. The CLI is the only shared surface and
                  works fully offline.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* 15. Final CTA: 2 cols, both columns (install / ship) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
          <div className="flex flex-col gap-4 p-6 lg:p-10">
            <p className="text-label-13 text-muted-foreground">Ready to ship?</p>
            <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
              Use the templates. Or ship with us.
            </h2>
            <p className="text-copy-16 text-muted-foreground leading-7 max-w-xl [&:not(:first-child)]:mt-0">
              Install the CLI to scaffold a project in under five minutes. Or
              talk to our delivery team. Same templates, same contracts, same
              guarantees.
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
              <Link href="/delivery">Talk to delivery</Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
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

