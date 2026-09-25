import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { UseCaseHero } from "../_components/use-case-page"
import { TechStackGrid } from "@/app/(marketing)/_components/tech-stack-grid"
import { CapabilityClustersSection } from "../_components/capability-cluster"
import {
  AdminDashboardMockup,
  BillingWidgetMockup,
  OnboardingMockup,
  QueueLogMockup,
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
    body: "Replace the placeholder with the product. The eight capabilities stay stable, so the surface you ship to customers is the only thing that changes.",
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
] as const

/**
 * First-party templates the org has built on this surface. They
 * each ship on their own hosted URL once published — today they
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
 * Four thematic clusters of capabilities a buyer reads when they
 * ask "is this everything I need to ship a B2B SaaS?". Each
 * cluster owns 3 capability rows with 2-3 sentence copy that says
 * what the buyer actually gets — concrete shape, not feature
 * label. Plain prose, no marketing fluff.
 */
const CAPABILITY_CLUSTERS = [
  {
    id: "auth-identity",
    iconName: "Lock",
    title: "Auth & identity",
    lead:
      "Who signs up, who pays, who is who. The four walls your customer data lives inside.",
    rows: [
      {
        id: "workspace-creation",
        title: "Workspace creation",
        body:
          "The signup form captures the workspace name, not just the user. Email verification uses the same provider the rest of your app already talks to, so a stray typo never opens a tenant in your org. Welcome mail sends before the dashboard renders, with the right slug pre-filled.",
      },
      {
        id: "multi-tenant",
        title: "Multi-tenant by default",
        body:
          "Every session is scoped to a workspace. Switching workspaces doesn't sign the user out — it filters what they see. Org-level roles travel with the workspace, not the user, so a freelancer leaving the team doesn't take the customer list with them.",
      },
      {
        id: "magic-oauth",
        title: "Magic links + OAuth",
        body:
          "Better Auth under the hood, with magic links, email+password, and six OAuth providers pre-wired. The proxy verifies email at signup so your Enterprise tier isn't selling to fake at gmail.",
      },
    ],
  },
  {
    id: "billing-growth",
    iconName: "CreditCard",
    title: "Billing & growth",
    lead:
      "How the money comes in, how the customer stays. The plumbing that pays for the rest.",
    rows: [
      {
        id: "subscriptions",
        title: "Subscriptions that scale",
        body:
          "Stripe subscriptions with plans, proration, and dunning wired against the same contract your database reads. Customer portal is generated, not built — your users see invoices and change plans without a support ticket.",
      },
      {
        id: "usage-metering",
        title: "Usage metering",
        body:
          "Charge per API call, per seat, per GB — whatever your product actually sells. The metering shape matches the contract your app code reads, so you never reconcile two sources of truth at month end.",
      },
      {
        id: "notifications",
        title: "Customer notifications",
        body:
          "Receipts, renewal warnings, and dunning sequences run on the same mail and queue layer as the rest of your app. No second vendor, no second dashboard to monitor.",
      },
    ],
  },
  {
    id: "operator-console",
    iconName: "Layers",
    title: "Operator console",
    lead:
      "What you see of your users — the surface that keeps the team out of the database.",
    rows: [
      {
        id: "admin",
        title: "Admin dashboard",
        body:
          "MRR, active users, churn at a glance. The user table is filtered by role and shows last-seen. Bulk actions hit the same RPC the customer API uses, so the operator console and the customer surface never drift.",
      },
      {
        id: "audit-log",
        title: "Audit trail",
        body:
          "Every cross-org call is recorded with the actor, the action, and the resource. Buyers in regulated verticals audit this in the first call; you don't have to explain what 'comprehensive logging' looks like.",
      },
      {
        id: "product-surface",
        title: "Domain data + search",
        body:
          "The CRUD layer on top of your Drizzle schema, with search and CSV export. Operators do not poke the database to find a customer; they use the same surface your support team uses.",
      },
    ],
  },
  {
    id: "background-work",
    iconName: "Workflow",
    title: "Background work",
    lead:
      "The work your users never see — but that holds the product together when it scales.",
    rows: [
      {
        id: "jobs",
        title: "Background jobs",
        body:
          "Queues and retries wired against the same contract the rest of the app uses. Failed jobs are visible in the same dashboard; retries are typed, not free-form shell scripts.",
      },
      {
        id: "observability",
        title: "Observability",
        body:
          "OpenTelemetry waterfall shows every job, every RPC call, every email send, on the same dashboard as your HTTP routes. Errors are tagged with the tool name and the call site, so a 500 in production has a runtime.",
      },
      {
        id: "scheduled",
        title: "Scheduled tasks",
        body:
          "Cron-style tasks live in the same registry as the rest of your code. They read the same schema, log to the same trace, fail with the same retry policy.",
      },
    ],
  },
] as const

/**
 * Mockup map keyed by cluster.id. One real mockup per cluster —
 * the right column swaps when the visitor selects a cluster card.
 * Unselected clusters get a quiet placeholder so the column
 * never reads as blank.
 */
const CLUSTER_MOCKUPS = {
  "auth-identity":     <OnboardingMockup />,
  "billing-growth":    <BillingWidgetMockup />,
  "operator-console":  <AdminDashboardMockup />,
  "background-work":   <QueueLogMockup />,
} as const

/**
 * Page wrapper. The wrapper's outer border + bg is provided by
 * GlobalLayout in apps/web/src/app/layout.tsx — we don't render
 * our own card frame, so the page sits flush inside the global
 * card with the same border treatment as the rest of the
 * marketing surface.
 */
export default function SaasAppsPage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero — capabilities (not a single template) */}
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

      {/* 2. What's in the box — four clusters of capabilities.
           Each cluster owns 3 capability rows with 2-3 sentence
           selling copy. The selected cluster drives the right
           column's mockup. Below the cluster list, a single
           CTA pushes the visitor to action. */}
      <section className="border-b border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-10 lg:px-10 lg:py-12">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            What&apos;s in the box
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            The four sub-systems every SaaS needs.
          </h2>
          <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Twelve capabilities grouped by the buyer-side question
            they answer. Pick a cluster, read what you actually get,
            and ship it.
          </p>
        </div>
        <CapabilityClustersSection
          clusters={CAPABILITY_CLUSTERS}
          mockups={CLUSTER_MOCKUPS}
        />
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
      <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Explore
          </p>
          <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            Related use cases.
          </h2>
        </div>
        <div className="grid grid-cols-1 divide-y divide-border lg:col-span-4 !p-0 border-0 md:grid-cols-3 md:divide-x md:divide-y-0">
          {RELATED.map((item) => (
            <Link
              key={item.slug}
              href={`/use-cases/${item.slug}`}
              className="group flex flex-col gap-2 p-6 transition-colors hover:bg-accent/40 lg:p-8"
            >
              <p className="text-label-13 text-muted-foreground">Related</p>
              <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="line-clamp-3 text-copy-14 leading-6 text-muted-foreground">
                {item.tagline}
              </p>
              <p className="inline-flex items-center gap-1 pt-1 text-label-13 text-foreground">
                Read more
                <ArrowRight
                  className="size-3 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* 7. Final CTA */}
      <FinalCta />
    </div>
  )
}
