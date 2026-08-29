import Link from "next/link"
import {
  ArrowRight,
  Boxes,
  CircleDollarSign,
  Cloud,
  Database,
  GitBranch,
  Globe,
  Layers,
  LineChart,
  Radio,
  Sparkles,
  TerminalSquare,
  Workflow,
  Zap,
} from "lucide-react"

import { getAllReleases } from "@/lib/blog/releases"
import { allKbGuides } from "content-collections"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Marketing homepage at `/`.
 *
 * Single source of truth for the surface a first-time visitor sees
 * when they land on deessejs.com. Renders as a server component.
 *
 * Layout — Vercel-style shared-border grid:
 *   • The hero is detached (no outer card) and sits above the wrapper.
 *   • Every other section lives inside a single wrapper div with a
 *     `border border-border bg-background rounded-none` outline.
 *   • Each section inside the wrapper is a CSS grid with `gap-0` and
 *     `divide-x divide-y divide-border` so cells share borders — no
 *     double strokes, no internal padding-rounding seams.
 *   • Sections are separated by `border-b border-border` on the last
 *     row of the previous grid (inherited from the wrapper outline).
 *
 * Sections, top to bottom:
 *   1. Hero — outcome headline, dual CTA, terminal mockup, install hint
 *   2. Trust strip — first-party signals
 *   3. Outcomes — three named scenarios, 3-col shared-border grid
 *   4. Contracts — bento, 6 cells in a 3-col shared-border grid
 *   5. CLI in action — 2-col shared-border grid (terminal + commands)
 *   6. Authority — 3-col shared-border grid (manifesto + KB + changelog)
 *   7. Stats — 4-col shared-border grid
 *   8. Final CTA — 2-col shared-border grid (copy + actions)
 *
 * KB guides and changelog releases come from `content-collections`.
 * Everything else is hard-coded here for V1 — when the surface
 * grows, the constants move into a dedicated data module and the
 * homepage shell stays a server component.
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

type Contract = {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

/** The six contracts wired into every template. */
const CONTRACTS: ReadonlyArray<Contract> = [
  {
    title: "Auth",
    description:
      "Sessions, organizations, invitations, and OAuth — already typed against Better Auth.",
    icon: Zap,
  },
  {
    title: "Database",
    description:
      "Drizzle schemas, migrations, and typed queries. Postgres by default, swappable.",
    icon: Database,
  },
  {
    title: "Billing",
    description:
      "Subscriptions, usage metering, and webhooks. The shape your agent can already call.",
    icon: CircleDollarSign,
  },
  {
    title: "Jobs",
    description:
      "Queues, retries, and dead-letter handling. Async work that does not block the request path.",
    icon: GitBranch,
  },
  {
    title: "Storage",
    description:
      "Object storage with signed URLs and presigned uploads. Drop-in S3-compatible.",
    icon: Boxes,
  },
  {
    title: "Observability",
    description:
      "Logs, traces, and metrics — the three signals that catch production issues.",
    icon: LineChart,
  },
]

/** First-party and community signals shown in the trust strip. */
const TRUST_SIGNALS: ReadonlyArray<{ label: string; href?: string }> = [
  { label: "deessejs/saas-template", href: "https://github.com/deessejs/saas-template" },
  { label: "@deessejs/cli", href: "https://www.npmjs.com/package/@deessejs/cli" },
  { label: "MCP-ready", href: "/knowledge-base" },
  { label: "MIT licensed", href: "https://github.com/deessejs" },
]

/** Terminal lines shown in the hero mockup. */
const HERO_TERMINAL: ReadonlyArray<{
  prompt: string
  output?: string
}> = [
  { prompt: "$ npx deessejs init my-saas", output: "✔ Selected template: saas-starter" },
  { prompt: "$ deessejs info", output: "6 contracts wired · 0 missing · ready" },
  { prompt: "$ pnpm dev", output: "▸ http://localhost:3000" },
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const featuredGuides = allKbGuides.slice(0, 3)
  const releases = getAllReleases().slice(0, 3)
  const totalTemplates = OUTCOMES.filter((t) => t.status === "shipped").length
  const totalContracts = CONTRACTS.length

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:gap-16 lg:py-20">
      {/* 1. Hero — detached, no outer card */}
      <section className="grid grid-cols-1 items-center gap-12 pt-8 lg:grid-cols-2 lg:gap-16 lg:pt-12">
        <div className="flex flex-col items-start gap-6 text-left">
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
          <h1 className="text-heading-48 sm:text-heading-56 lg:text-heading-64 font-bold tracking-tighter text-balance max-w-2xl">
            Your coding agent should ship from contracts, not from scratch.
          </h1>
          <p className="text-muted-foreground text-copy-18 leading-7 max-w-xl text-balance [&:not(:first-child)]:mt-0">
            DeesseJS is a registry of Next.js SaaS templates with the contracts
            already wired — auth, database, billing, jobs, storage. Your agent
            reads them, builds on them, and cannot break them.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
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
        </div>

        <TerminalMockup lines={HERO_TERMINAL} label="~/projects" />
      </section>

      {/* Shared-border wrapper — every section below this lives inside one card */}
      <div className="border border-border bg-background rounded-none">
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

        {/* 3. Outcomes — 3 cols, shared borders */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          <Cell className="col-span-1 md:col-span-3 !p-0 border-0">
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">Outcomes</p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                Pick the outcome. The template ships the rest.
              </h2>
              <p className="text-copy-16 text-muted-foreground leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
                Every template in the registry bundles the same six contracts.
                You pick the scenario; the registry wires auth, database,
                billing, jobs, storage, and observability against it.
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
                className="group flex flex-col gap-3 p-6 transition-colors hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <Icon
                    className="text-foreground size-5 shrink-0"
                    aria-hidden
                  />
                  <Badge variant="outline" className="text-label-12">
                    {outcome.status === "coming-soon"
                      ? "Coming soon"
                      : "Shipped"}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-label-13 text-muted-foreground">
                    {outcome.scenario}
                  </p>
                  <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                    {outcome.name}
                  </h3>
                </div>
                <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
                  {outcome.blurb}
                </p>
                <ul className="flex flex-wrap items-center gap-1.5 pt-1">
                  {outcome.stack.map((item) => (
                    <li
                      key={item}
                      className="text-label-12 text-muted-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-label-13 text-foreground inline-flex items-center gap-1 pt-1 transition-transform group-hover:translate-x-0.5">
                  Open the template
                  <ArrowRight className="size-3" aria-hidden />
                </p>
              </Link>
            )
          })}
        </div>

        {/* 4. Contracts — bento, 6 cells in a 3-col shared-border grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y divide-border sm:divide-y-0 sm:divide-x divide-border border-b border-border">
          <Cell className="col-span-1 sm:col-span-2 lg:col-span-3 !p-0 border-0">
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">
                Wired into every starter
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                Six contracts your agent can read.
              </h2>
              <p className="text-copy-16 text-muted-foreground leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
                Each contract ships with a typed schema, an MCP server, and a
                CLI check. If a template is missing one, the CLI refuses to
                scaffold.
              </p>
            </div>
          </Cell>
          {CONTRACTS.map((contract) => {
            const Icon = contract.icon
            return (
              <article
                key={contract.title}
                className="flex flex-col gap-3 p-6"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-md border border-border bg-muted/40">
                    <Icon className="text-foreground size-4" aria-hidden />
                  </span>
                  <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                    {contract.title}
                  </h3>
                </div>
                <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
                  {contract.description}
                </p>
              </article>
            )
          })}
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

        {/* 7. Stats — 4 cols, shared borders */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          <Stat label="templates" value={totalTemplates.toString()} />
          <Stat
            label="contracts wired"
            value={`${totalContracts}/${totalContracts}`}
          />
          <Stat label="KB guides" value={allKbGuides.length.toString()} />
          <Stat label="license" value="MIT" />
        </div>

        {/* 8. Final CTA — 2 cols, shared borders */}
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
      className="overflow-hidden rounded-lg border border-border bg-foreground text-foreground shadow-sm"
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