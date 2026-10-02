import type { Metadata } from "next"
import Link from "next/link"
import {
  RelatedUseCases,
  type RelatedUseCaseItem,
} from "../_components/related-use-cases"

import { UseCaseHero } from "../_components/use-case-page"
import { TechStackGrid } from "@/app/(marketing)/_components/tech-stack-grid"
import {
  AuthFlowMockup,
  BillingWidgetMockup,
} from "../_components/mockups"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

export const metadata: Metadata = {
  title: "SaaS apps | DeesseJS",
  description:
    "Multi-tenant B2B SaaS with auth, billing, and a working dashboard on day one.",
}

/**
 * Stack specific to the SaaS surface. Six brands, same set the
 * hero CTA already names implicitly. Re-rendered through
 * <TechStackGrid> (the same component the homepage + pricing
 * page use) so every brand display on the site stays in lockstep.
 */
const STACK = [
  { name: "Next.js",     logo: "vercel" },
  { name: "Better Auth", logo: "betterauth" },
  { name: "Drizzle",     logo: "drizzle" },
  { name: "Postgres",    logo: "postgresql" },
  { name: "Stripe",      logo: "stripe" },
  { name: "Resend",      logo: "resend" },
] as const

const STEPS = [
  {
    heading: "Scaffold the stack",
    body: "Run the CLI. The contracts are wired before the first file is generated. Multi-tenant boundaries, rate limiting, and transactional email come preconfigured.",
  },
  {
    heading: "Wire your domain",
    body: "Replace the placeholder with the product. The eight pillars stay stable, so the surface you ship to customers is the only thing that changes.",
  },
  {
    heading: "Ship to your first customer",
    body: "Auth, billing, jobs, and observability are already in place. Your time goes into the part of the product that customers actually see.",
  },
] as const

const RELATED = [
  {
    slug: "internal-tools",
    title: "Internal tools",
    tagline:
      "Operator consoles that work behind SSO, on the same auth and contracts as your customer app.",
  },
  {
    slug: "api-backends",
    title: "API backends",
    tagline:
      "Service-only backends with type-safe RPC and zero frontend overhead.",
  },
  {
    slug: "ai-products",
    title: "AI products",
    tagline:
      "RAG, chat, and agents wired against the same contracts your app uses.",
  },
] as const satisfies ReadonlyArray<RelatedUseCaseItem>

/**
 * First-party templates the org has built on this surface. They
 * each ship on their own hosted URL once published -- today they
 * remain pre-launch. The card grid signals production-ready
 * output without requiring links that don't resolve yet.
 */
const BUILT_TEMPLATES = [
  { slug: "saas-starter",  title: "saas-starter",  body: "B2B SaaS scaffold with orgs, billing, dashboard." },
  { slug: "ops-console",   title: "ops-console",   body: "Operator console wired on the same Better Auth and Drizzle schema." },
  { slug: "billing-portal", title: "billing-portal", body: "Stripe customer portal preconfigured for usage metering." },
  { slug: "team-onboarding", title: "team-onboarding", body: "Workspace invite flow with email verify and role assignment." },
] as const

/**
 * Eight global pillars a buyer reads when they ask "do I get a
 * real SaaS app on day one, or a half-wired scaffold?". Each
 * pillar is framed as a problem the buyer's customer creates,
 * followed by what the registry ships to answer it. Two pillars
 * (Auth, Billing) anchor the page visually with a real mockup;
 * the other six are text-only so the grid stays clean and the
 * reading order stays B-team rather than visual showcase.
 *
 * Order is decision-critical first (Auth, Billing, Admin), then
 * operational (Jobs, Mail), then infrastructure (Database, API,
 * MCP). The buyer reads "I can charge" before "I can wire a
 * trace".
 */
type Pillar = {
  id: string
  problem: string
  title: string
  solution: string
  mockup?: React.ReactNode
}

const PILLARS: ReadonlyArray<Pillar> = [
  {
    id: "auth",
    problem: "First sign-up decides whether you sell or keep tickets.",
    title: "Auth",
    solution:
      "Better Auth under the hood. Magic links, email + password, and six OAuth providers wired against the same proxy the dashboard talks through. Email verification happens before the workspace opens, so the Enterprise tier never sells to a fake at gmail.",
    mockup: <AuthFlowMockup />,
  },
  {
    id: "billing",
    problem: "Every invoice you can't reconcile is a refund waiting to happen.",
    title: "Billing",
    solution:
      "Stripe subscriptions, plans, proration, dunning, and a generated customer portal wired against the same contract the database reads. Usage metering matches the shape your app code reads, so month-end is the same query as the in-app counter.",
    mockup: <BillingWidgetMockup />,
  },
  {
    id: "admin",
    problem: "An admin dashboard that drifts from the customer surface is a support ticket waiting to happen.",
    title: "Admin",
    solution:
      "The operator console sits on the same RPC the customer surface uses, so what an admin changes is what a customer sees. MRR, churn, last-seen, bulk actions -- all on the same trace as the app code, not a parallel dashboard.",
  },
  {
    id: "jobs",
    problem: "A 500 the customer sees is only ever the half of it.",
    title: "Jobs",
    solution:
      "Queues, retries, and cron live in the same registry as the rest of the code. Failed jobs surface in the same dashboard as 5xx; retries are typed, not free-form shell scripts.",
  },
  {
    id: "mail",
    problem: "A receipt that lands late is a chargeback that lands faster.",
    title: "Mail",
    solution:
      "Resend + React Email, all channels on the same contract the rest of the app sends through. Welcome mail, renewals, dunning, and security alerts run on the same queue and the same retry policy, so a single misfire has one place to look.",
  },
  {
    id: "database",
    problem: "Two ORMs hide the truth.",
    title: "Database",
    solution:
      "Drizzle + Postgres, migrations as a typed registry command. The schema your app code reads is the schema the operator console reads; there is no second ORM hiding under the admin tools.",
  },
  {
    id: "api",
    problem: "Drift between your docs and your types is the front door for a bug report.",
    title: "API",
    solution:
      "Hono + oRPC, end-to-end typed. The contract the customer app sends is the contract the public docs publish -- same types, same validator, no hand-written translation between the two.",
  },
  {
    id: "mcp",
    problem: "A model that calls your data through a one-off integration is tomorrow's incident.",
    title: "MCP",
    solution:
      "Twelve typed tools exposed over the same oRPC contract the API uses. The model calls your data the same way your app does, on the same auth and the same trace.",
  },
]

/**
 * Page wrapper. The wrapper's outer border + bg is provided by
 * GlobalLayout in apps/web/src/app/layout.tsx -- we don't render
 * our own card frame, so the page sits flush inside the global
 * card with the same border treatment as the rest of the
 * marketing surface.
 */
export default function SaasAppsPage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero -- one-promise framing */}
      <UseCaseHero
        category="SaaS"
        title="Production-grade B2B SaaS, out of the box."
        body="Multi-tenant auth, billing, an operator console, and the jobs and observability behind it. The four sub-systems a SaaS needs are wired into the registry before your first commit."
        primaryCta={{
          label: "Use it yourself",
          href: "/templates",
        }}
        secondaryCta={{
          label: "Talk to delivery",
          href: "/delivery",
        }}
      />

      {/* 2. What's in the box -- 8 global pillars, 4-col Pattern C
           grid (bg-border gap-px). Mockups for Auth + Billing, text-only
           for the other 6. */}
      <section className="border-b border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-10 lg:px-10 lg:py-12">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            What&apos;s in the box
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            Eight pillars. One working SaaS.
          </h2>
          <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            The sub-systems every SaaS needs, wired against the same
            contract before the first commit. Not a feature catalog
            -- the problems a paying customer creates, and what the
            registry ships to answer them.
          </p>
        </div>
        <div className="grid grid-cols-1 bg-border gap-px sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <article
              key={p.id}
              className="flex flex-col gap-3 bg-background p-6 lg:p-8"
            >
              {p.mockup ? (
                <div className="overflow-hidden rounded-md border border-border bg-background">
                  {p.mockup}
                </div>
              ) : null}
              <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
                {p.problem}
              </p>
              <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
                {p.title}
              </h3>
              <p className="text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
                {p.solution}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* 3. Stack */}
      {/*    Same TechStackGrid used on the homepage and /pricing.
           Header row on top, brand wall underneath. The brand
           tiles rotate on a swap animation, so the surface
           reads as a living tech stack rather than a static
           logo dump. */}
      <section className="flex flex-col border-t border-border">
        <div className="flex flex-col gap-3 px-6 py-10 lg:px-10 lg:py-12 border-b border-border">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Stack
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            What runs on day one.
          </h2>
        </div>
        <TechStackGrid techs={STACK} />
      </section>

      {/* 4. Process */}
      <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Process
          </p>
          <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            How a SaaS ships.
          </h2>
        </div>
        <ol className="grid grid-cols-1 divide-y divide-border lg:col-span-4 !p-0 border-0 md:grid-cols-3 md:divide-x md:divide-y-0">
          {STEPS.map((step, idx) => (
            <li
              key={step.heading}
              className="flex flex-col gap-3 p-6 lg:p-8"
            >
              <span className="font-mono text-copy-13 text-muted-foreground">
                Step {String(idx + 1).padStart(2, "0")}
              </span>
              <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
                {step.heading}
              </h3>
              <p className="text-copy-14 leading-6 text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* 5. Built on this */}
      {/*    Two-row layout: header full-width on top, then 4 cards
           on a single lg:grid-cols-4 row. Each card is fully
           clickable (entire <Link> wrapper) but currently uses
           href="#" since the template URLs are not yet deployed.
           Replace "#" with the live URL when the corresponding
           site ships. Each card carries a grey placeholder
           block at the top (no illustration, no label, no CTA
           below) so the section reads as 4 product surfaces
           waiting to render. */}
      <section className="flex flex-col border-t border-border">
        <div className="flex flex-col gap-3 px-6 py-10 lg:px-10 lg:py-12 border-b border-border">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Built on this
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            Four templates, each on its own surface.
          </h2>
          <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Production-ready starter templates, each deployed at its own
            URL. Used as the reference set for what the registry can ship.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y divide-border sm:divide-y-0 sm:divide-x sm:divide-border">
          {BUILT_TEMPLATES.map((tpl) => (
            <Link
              key={tpl.slug}
              href="#"
              aria-label={`Visit ${tpl.slug}`}
              className="group flex flex-col transition-colors hover:bg-accent/40"
            >
              <div
                aria-hidden
                className="aspect-[16/10] w-full border-b border-border bg-muted/40 transition-colors group-hover:bg-muted/60"
              />
              <div className="flex flex-1 flex-col gap-2 p-6">
                <h3 className="font-mono text-copy-16 font-medium text-foreground">
                  {tpl.title}
                </h3>
                <p className="text-copy-14 leading-6 text-muted-foreground">
                  {tpl.body}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Related */}
      <RelatedUseCases items={RELATED} />

      {/* 7. Final CTA */}
      <FinalCta />
    </div>
  )
}