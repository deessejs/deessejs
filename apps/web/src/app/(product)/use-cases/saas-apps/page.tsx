import type { Metadata } from "next"
import Link from "next/link"
import { codeToHtml } from "shiki"
import {
  RelatedUseCases,
  type RelatedUseCaseItem,
} from "../_components/related-use-cases"

import { Section } from "@/components/marketing/section"
import { SectionHeader } from "@/components/marketing/section-header"
import { UseCaseHero } from "../_components/use-case-page"
import { TechStackGrid } from "@/components/marketing/tech-stack-grid"
import {
  UseCaseTabs,
  type UseCaseTab,
} from "../_components/use-case-tabs"
import {
  SAAS_SNIPPETS,
  type SaasPillarSlug,
} from "../_components/saas-snippets"
import { FinalCta } from "@/components/pages/use-cases/final-cta"
import { APP_CONFIG } from "@/lib/app-config"

export const metadata: Metadata = {
  title: "SaaS apps | DeesseJS",
  description:
    "Multi-tenant B2B SaaS with auth, billing, jobs, mail, DB, admin, and a working API on day one.",
  alternates: {
    canonical: "/use-cases/saas-apps",
  },
  openGraph: {
    title: "SaaS apps | DeesseJS",
    description:
      "Multi-tenant B2B SaaS with auth, billing, jobs, mail, DB, admin, and a working API on day one.",
    siteName: APP_CONFIG.name,
    locale: "en_US",
    url: "/use-cases/saas-apps",
  },
  twitter: {
    card: "summary_large_image",
    title: "SaaS apps | DeesseJS",
    description:
      "Multi-tenant B2B SaaS with auth, billing, jobs, mail, DB, admin, and a working API on day one.",
  },
}

/**
 * Stack specific to the SaaS surface. Same eight brands the
 * homepage and /pricing page ship on, so the brand wall reads
 * the same way across every surface. Re-rendered through
 * <TechStackGrid> (the same component the homepage + pricing
 * page use) so every brand display on the site stays in lockstep.
 */
const STACK = [
  { name: "Next.js",     logo: "vercel" },
  { name: "Better Auth", logo: "betterauth" },
  { name: "Drizzle",     logo: "drizzle" },
  { name: "Postgres",    logo: "postgresql" },
  { name: "Stripe",      logo: "stripe" },
  { name: "Cloudflare",  logo: "cloudflare" },
  { name: "Resend",      logo: "resend" },
  { name: "OpenAI",      logo: "openai" },
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
 * pillar ships as a tab in a 4+4 mirrored layout, with a real
 * TypeScript snippet peeking out of the column's far corner.
 *
 * The first half ("Customer surface") lists the four pillars a
 * buyer names when they think about a paying customer: Auth,
 * Billing, Admin, Database. The second half ("Behind the
 * curtain") lists the four pillars they name when they think
 * about operations: API, MCP, Jobs, Mail. The two halves
 * read in the order a customer-facing product person cares
 * about first, then the order an on-call engineer cares about.
 */
type PillarEntry = UseCaseTab & { id: SaasPillarSlug }

const PILLAR_ENTRIES: ReadonlyArray<PillarEntry> = [
  {
    id: "auth",
    slug: "auth",
    iconName: "KeyRound",
    title: "Auth",
    description:
      "Better Auth on the same proxy the dashboard talks through. Email + password, magic links, and OAuth providers, all behind one session.",
  },
  {
    id: "billing",
    slug: "billing",
    iconName: "CreditCard",
    title: "Billing",
    description:
      "Stripe subscriptions, plans, proration, and a generated customer portal. Usage metering matches the shape your app code reads.",
  },
  {
    id: "admin",
    slug: "admin",
    iconName: "ShieldCheck",
    title: "Admin",
    description:
      "Operator console on the same RPC the customer surface uses. Impersonate, refund, override plans, with the same audit trail the rest of the app carries.",
  },
  {
    id: "database",
    slug: "database",
    iconName: "Database",
    title: "Database",
    description:
      "Drizzle on Postgres, migrations as a typed registry command. The schema the app code reads is the schema the operator console reads.",
  },
  {
    id: "api",
    slug: "api",
    iconName: "Wrench",
    title: "API",
    description:
      "Hono + oRPC, end-to-end typed. The contract the customer app sends is the contract the public docs publish, with no hand-written translation.",
  },
  {
    id: "mcp",
    slug: "mcp",
    iconName: "Radio",
    title: "MCP",
    description:
      "Typed tools exposed over the same oRPC contract the API uses. The model calls your data the same way your app does, on the same auth and trace.",
  },
  {
    id: "jobs",
    slug: "jobs",
    iconName: "Boxes",
    title: "Jobs",
    description:
      "Queues, retries, and cron on the same registry as the rest of the code. Failed jobs surface in the same dashboard as 5xx; retries are typed.",
  },
  {
    id: "mail",
    slug: "mail",
    iconName: "Mail",
    title: "Mail",
    description:
      "Resend + React Email on the same contract the rest of the app sends through. Welcome, renewals, dunning, and security alerts, all on one queue.",
  },
]

const PILLARS_GROUP_1: ReadonlyArray<UseCaseTab> = PILLAR_ENTRIES.filter(
  (p) => p.id === "auth" || p.id === "billing" || p.id === "admin" || p.id === "database",
)

const PILLARS_GROUP_2: ReadonlyArray<UseCaseTab> = PILLAR_ENTRIES.filter(
  (p) => p.id === "api" || p.id === "mcp" || p.id === "jobs" || p.id === "mail",
)

/**
 * Page wrapper. The wrapper's outer border + bg is provided by
 * GlobalLayout in apps/web/src/app/layout.tsx -- we don't render
 * our own card frame, so the page sits flush inside the global
 * card with the same border treatment as the rest of the
 * marketing surface.
 */
export default async function SaasAppsPage() {
  // Pre-render the eight saas pillar snippets server-side via Shiki,
  // so the UseCaseTabs Client Component below receives plain
  // highlighted HTML strings (Next 16 forbids async Server Components
  // as children of Client Components). Same pattern as the homepage
  // Ecosystem section and the /cli CliStart section.
  const htmlBySlug: Record<string, { tabName: string; html: string }[]> = {
    auth: [], billing: [], admin: [], database: [],
    api: [], mcp: [], jobs: [], mail: [],
  }

  await Promise.all(
    (Object.keys(SAAS_SNIPPETS) as SaasPillarSlug[]).flatMap((slug) =>
      SAAS_SNIPPETS[slug].files.map((file) =>
        codeToHtml(file.code, {
          lang: file.lang,
          themes: { light: "github-light", dark: "github-dark" },
          defaultColor: false,
        }).then((html) => {
          htmlBySlug[slug]?.push({ tabName: file.tabName, html })
        }),
      ),
    ),
  )

  return (
    <div className="flex flex-col">
      {/* 1. Hero -- one-promise framing */}
      <UseCaseHero
        category="SaaS"
        title="Production-grade B2B SaaS, out of the box."
        body="In one click, you have a working SaaS app. Auth, billing, jobs, mail, and the operator console wired against the same contract as the rest of your stack. Eight pillars, not twelve capabilities. The registry ships them before the first commit."
        primaryCta={{
          label: "Use it yourself",
          href: "/templates",
        }}
        secondaryCta={{
          label: "Talk to delivery",
          href: "/delivery",
        }}
      />

      {/* 2. What's in the box -- 4+4 mirrored tabs.
           Customer surface (Auth, Billing, Admin, Database) reads
           first with tabs LEFT and a Shiki peek on the RIGHT. Behind
           the curtain (API, MCP, Jobs, Mail) follows as its own
           <Section> with the same Tabs component flipped (tabs RIGHT,
           peek LEFT). The sub-eyebrow names the boundary so the reader
           can follow the seam between the two halves. Two <Section>s
           keep the page's border rhythm identical to the rest of the
           marketing surface (one border-b per section). */}
      <Section>
        <SectionHeader
          eyebrow="What's in the box"
          title="Eight pillars. One working SaaS."
          subtitle="The sub-systems every SaaS needs, wired against the same contract before the first commit. Two halves: what your customers see, and what keeps it running."
          bordered={true}
        />
        <UseCaseTabs
          pillars={PILLARS_GROUP_1}
          htmlBySlug={htmlBySlug}
        />
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Behind the curtain"
          title="What keeps a SaaS running."
          subtitle="The four sub-systems an on-call engineer names first. Same contracts, same registry, same auth, just on the other side of the same RPC."
          bordered={true}
        />
        <UseCaseTabs
          pillars={PILLARS_GROUP_2}
          htmlBySlug={htmlBySlug}
          reverse
        />
      </Section>

      {/* 3. Stack */}
      {/*    Same TechStackGrid + same Section shape as the homepage
           and /pricing. Header row on top, brand wall underneath. The
           brand tiles rotate on a swap animation, so the surface
           reads as a living tech stack rather than a static logo dump. */}
      <Section>
        <div className="flex flex-col divide-y divide-border">
          <div className="px-6 py-6 lg:px-10">
            <p className="text-heading-24 tracking-tighter text-balance [&:not(:first-child)]:mt-0">
              Built with the stack senior engineers ship on.
            </p>
          </div>
          <TechStackGrid techs={STACK} />
        </div>
      </Section>

      {/* 4. Process */}
      <div className="grid grid-cols-1 border-t border-border lg:grid-cols-12 lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-3 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Process
          </p>
          <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            How a SaaS ships.
          </h2>
        </div>
        <ol className="grid grid-cols-1 divide-y divide-border lg:col-span-9 !p-0 border-0 md:grid-cols-3 md:divide-x md:divide-y-0">
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