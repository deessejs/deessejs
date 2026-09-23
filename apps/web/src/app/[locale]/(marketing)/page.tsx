import Link from "next/link"
import {
  ArrowRight,
  ChevronRight,
  Cloud,
  Globe,
  Layers,
  Radio,
  TerminalSquare,
} from "lucide-react"

import { allKbGuides } from "content-collections"

import { MarketingPage } from "./_components/marketing-page"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { ContractsGrid, type Contract } from "./_components/contracts-grid"
import { EcosystemTabs } from "./_components/ecosystem-tabs"
import { FlickeringGrid } from "./_components/flickering-grid"
import { SurfacesTabs } from "./_components/surfaces-tabs"
import { TechStackGrid } from "./_components/tech-stack-grid"
import { TerminalMockup } from "./_components/terminal-mockup"
import { TestimonialsMarquee } from "./_components/testimonials-marquee"

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
 *  11. Testimonials: 12 placeholder cards in an infinite horizontal marquee
 *  12. Integrations: logo wall (frameworks + providers + agents)
 *  13. Stats: 4 cells, two are tier-1 third-party metrics (npm + GH)
 *  14. FAQ: 2/4 split, accordion of common questions
 *  15. Final CTA: 2-col shared-border grid carrying both columns (install / ship)
 *
 * KB guides come from `content-collections`. Stack-matrix logos come from
 * `public/logos/*.svg` (CC0 via simple-icons). Everything else is hard-coded
 * here. When the surface grows, the constants move into a dedicated data
 * module.
 *
 * Positioning rationale: see
 * `apps/internal-documentation/content/docs/(root)/home-positioning-strategy.mdx`.
 */

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

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
  const featuredGuides = allKbGuides.slice(0, 4)

  return (
    <MarketingPage>
      {/* 1. Hero: stacked like Infisical — H1 full-width on top, subtitle
          + CTAs in a row below, then a 2:1 media placeholder. Keeps the
          FlickeringGrid as background texture. */}
        <div className="relative border-b border-border overflow-hidden">
          <FlickeringGrid
            className="absolute inset-0 z-0 opacity-60"
            squareSize={3}
            gridGap={5}
            flickerChance={0.15}
            maxOpacity={0.18}
            color="rgb(120, 120, 120)"
          />

          <div className="relative max-w-7xl mx-auto z-10 flex flex-col gap-6 lg:gap-8 px-8 py-12 lg:px-12 lg:py-16">
            {/* Top: H1 with the badge pill above it, left-aligned, full width */}
            <div className="flex flex-col items-start gap-5 lg:gap-6">
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
                The registry that shortens your time to production.
              </h1>
            </div>

            {/* Row: subtitle (left, ~4/7), spacer, CTAs (right, ~2/7) */}
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,_4fr)_minmax(0,_1fr)_minmax(0,_2fr)] items-end gap-6">
              <p className="text-muted-foreground text-copy-16 sm:text-copy-18 leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0">
                Stop spending the first ten weeks rebuilding the same six
                services. Start where the actual product begins.
              </p>
              <div aria-hidden />
              <div className="flex flex-wrap items-center justify-start md:justify-end gap-3">
                <Button asChild size="lg">
                  <Link href="/templates">Browse templates</Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="bg-background hover:bg-accent/40">
                  <Link href="/contact">
                    <ChevronRight className="size-3.5" aria-hidden />
                    Talk to an expert
                  </Link>
                </Button>
              </div>
            </div>

            {/* Media placeholder: 2:1 panel, full width, lighter background
                to mock the future central illustration without committing
                to a final design. */}
            <div
              aria-hidden
              className="relative w-full aspect-[2/1] border border-border bg-muted/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-size-[12px_12px] opacity-60" />
            </div>
          </div>
        </div>

        {/* 1b. Built with: row 1 = label + title, row 2 = tech stack grid */}
        <div className="grid grid-cols-1 divide-y divide-border border-b border-border">
          <div className="px-8 py-6">
            <p className="text-heading-24 tracking-tighter text-balance [&:not(:first-child)]:mt-0">
              Built with the stack senior engineers ship on.
            </p>
          </div>
          <TechStackGrid techs={TECH_STACK} />
        </div>

        {/* 2. Surfaces: 3-col grid on md (6 surfaces), 4-col grid on 2xl
            (8 surfaces, with Blogs and E-commerce appearing only on
            wider viewports). */}
        <div className="grid grid-cols-1 border-b border-border">
          <div className="flex flex-col gap-4 p-6 md:p-8 lg:p-10 border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center">
                <div
                  aria-hidden
                  className="mr-4 shrink-0 w-[1.7px] h-[13.5px] bg-foreground"
                />
                <span className="font-mono uppercase text-[0.8125rem] leading-[1.2] text-foreground opacity-64 font-medium tracking-[-0.01em]">
                  Pick the surface, skip the boilerplate
                </span>
              </div>
              <Link
                href="/templates"
                className="inline-flex items-center gap-1 text-label-13 text-foreground hover:underline underline-offset-4 shrink-0"
              >
                <ChevronRight className="size-3" aria-hidden />
                Explore all surfaces
              </Link>
            </div>
            <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Pick the surface. Get the convention.
            </h2>
            <p className="text-copy-16 text-muted-foreground leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
              Six surfaces, one registry. Each surface ships with the
              same contracts, the same patterns, and the same guarantees,
              whether you build it yourself or ship with us.
            </p>
          </div>
          <SurfacesTabs />
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

        {/* 8. Latest guides: single-row grid of 3 article cards, each
            with a placeholder mockup thumbnail on top and a footer
            link to the full KB index. */}
        <div className="grid grid-cols-1 border-b border-border">
          <div className="flex items-center justify-between gap-4 p-6 md:p-8 lg:p-10 border-b border-border">
            <div className="flex items-center">
              <div
                aria-hidden
                className="mr-4 shrink-0 w-[1.7px] h-[13.5px] bg-foreground"
              />
              <span className="font-mono uppercase text-[0.8125rem] leading-[1.2] text-foreground opacity-64 font-medium tracking-[-0.01em]">
                Latest guides
              </span>
            </div>
            <Link
              href="/knowledge-base"
              className="inline-flex items-center gap-1 text-label-13 text-foreground hover:underline underline-offset-4 shrink-0"
            >
              <ChevronRight className="size-3" aria-hidden />
              All guides
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y divide-border md:divide-y-0 md:divide-x divide-border">
            {featuredGuides.map((guide) => (
              <Link
                key={guide.slug}
                href={guide.url}
                className="group flex flex-col transition-colors hover:bg-accent/40"
              >
                {/* Placeholder thumbnail (mockup for now) */}
                <div
                  aria-hidden
                  className="relative aspect-[16/9] border-b border-border bg-muted/40 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-size-[12px_12px] opacity-60" />
                </div>
                <div className="flex flex-col gap-2 p-6 lg:p-8 flex-1">
                  <span className="font-mono uppercase text-[0.8125rem] leading-[1.2] text-foreground opacity-64 font-medium tracking-[-0.01em]">
                    Guide
                  </span>
                  <h3 className="text-heading-20 lg:text-heading-24 tracking-tight text-foreground !m-0 text-balance">
                    {guide.title}
                  </h3>
                  <p className="text-copy-14 text-muted-foreground leading-6 !m-0 text-balance">
                    {guide.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 10. Ecosystem: tabbed layout with placeholder mockup on the
            left and 4 product cards stacked on the right. Mirrors the
            SurfacesTabs pattern, mirrored horizontally. */}
        <div className="grid grid-cols-1 border-b border-border">
          <div className="flex items-center justify-between gap-4 p-6 md:p-8 lg:p-10 border-b border-border">
            <div className="flex items-center">
              <div
                aria-hidden
                className="mr-4 shrink-0 w-[1.7px] h-[13.5px] bg-foreground"
              />
              <span className="font-mono uppercase text-[0.8125rem] leading-[1.2] text-foreground opacity-64 font-medium tracking-[-0.01em]">
                One ecosystem, four tools
              </span>
            </div>
          </div>
          <EcosystemTabs />
        </div>

        {/* 11. Testimonials: infinite horizontal marquee of 12 placeholder
            cards, paused on hover. Edge fades on left + right. */}
        <div className="grid grid-cols-1 border-b border-border">
          <div className="flex items-center justify-between gap-4 p-6 md:p-8 lg:p-10 border-b border-border">
            <div className="flex items-center">
              <div
                aria-hidden
                className="mr-4 shrink-0 w-[1.7px] h-[13.5px] bg-foreground"
              />
              <span className="font-mono uppercase text-[0.8125rem] leading-[1.2] text-foreground opacity-64 font-medium tracking-[-0.01em]">
                What customers say
              </span>
            </div>
          </div>
          <TestimonialsMarquee />
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
    </MarketingPage>
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
