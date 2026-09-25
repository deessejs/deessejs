import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { UseCaseHero } from "../_components/use-case-page"
import { TechStackGrid } from "@/app/(marketing)/_components/tech-stack-grid"
import { CapabilityClustersSection } from "../_components/capability-cluster"
import {
  AdminDashboardMockup,
  ApiEndpointMockup,
  AuthFlowMockup,
} from "../_components/mockups"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

export const metadata: Metadata = {
  title: "Internal tools | DeesseJS",
  description:
    "Admin dashboards and operator consoles that work behind SSO.",
}

/**
 * Stack specific to the internal-tools surface. Same shape as
 * the other use-case pages so the brand display stays uniform.
 */
const STACK = [
  { name: "Next.js",     logo: "vercel" },
  { name: "Better Auth", logo: "betterauth" },
  { name: "TanStack",    logo: "cloudflare" },
  { name: "shadcn/ui",   logo: "shadcnui" },
] as const

const STEPS = [
  {
    heading: "Auth behind the same wall",
    body:
      "Better Auth on the admin subdomain. SSO and roles wired against your existing user table.",
  },
  {
    heading: "Operators see what they should",
    body:
      "Scoped roles, audit log, and rate limits. The contract that gates your customer app gates your support console too.",
  },
  {
    heading: "No second codebase to maintain",
    body:
      "The operator console consumes the same Drizzle schema and the same Better Auth sessions as the customer surface. One type system, one deploy.",
  },
] as const

const RELATED = [
  {
    slug: "saas-apps",
    title: "SaaS apps",
    tagline:
      "Multi-tenant B2B SaaS with auth, billing, and a working dashboard on day one.",
  },
  {
    slug: "open-source",
    title: "Open source",
    tagline:
      "Maintainer-friendly starters, MIT-licensed, versioned through the same registry.",
  },
  {
    slug: "ai-products",
    title: "AI products",
    tagline:
      "RAG, chat, and agents wired against the same contracts your app uses.",
  },
] as const

const BUILT_TEMPLATES = [
  { slug: "admin-console",  title: "admin-console",  body: "KPI roll-ups, user table, bulk actions." },
  { slug: "audit-explorer", title: "audit-explorer", body: "Search and replay every cross-org call." },
  { slug: "feature-flags",  title: "feature-flags",  body: "Per-org, per-plan flag targeting + history." },
  { slug: "support-inbox",  title: "support-inbox",  body: "Tickets land in the same DB the customer uses." },
] as const

/**
 * Four thematic clusters of capabilities for an internal-tools
 * buyer (operator console / support console). Same shape as
 * /use-cases/saas-apps and /use-cases/ai-products.
 */
const CAPABILITY_CLUSTERS = [
  {
    id: "auth-and-rbac",
    iconName: "Lock",
    title: "Auth & RBAC",
    lead:
      "Operator identity sits behind the same wall as customer identity, with role-based gating.",
    rows: [
      {
        id: "sso",
        title: "SSO from your existing provider",
        body:
          "Better Auth wires the operator console against the same user table your customer app uses. No separate password store to provision, no separate rotation cycle.",
      },
      {
        id: "rbac",
        title: "Role-based access",
        body:
          "Scoped roles per operator: read-only, support, finance, ops. Role gates live on the procedure definition, not in a separate middleware you forget to wire up.",
      },
      {
        id: "audit-log",
        title: "Audit trail by default",
        body:
          "Every operator action records the actor, the action, and the target. Buyers in regulated verticals audit this in the first call.",
      },
    ],
  },
  {
    id: "operator-console",
    iconName: "Layers",
    title: "Operator console",
    lead:
      "The surface the support team operates from. Same data the customer sees, scoped to the operator's role.",
    rows: [
      {
        id: "users-table",
        title: "Users table with bulk actions",
        body:
          "Searchable user table with role filters and bulk operations (impersonate, suspend, reset). Bulk actions hit the same RPC the customer API does, so the two never drift.",
      },
      {
        id: "subscription-ops",
        title: "Subscription overrides",
        body:
          "Override plans, refund invoices, extend trials — without writing SQL. Every override records the actor and the reason.",
      },
      {
        id: "kpis",
        title: "Live KPIs",
        body:
          "MRR, churn, active users, p95 latency. The numbers come from the same queries the product runs, so they're never a stale export.",
      },
    ],
  },
  {
    id: "support-and-tickets",
    iconName: "MessageSquare",
    title: "Support & tickets",
    lead:
      "The inbox your support team works in. Tied to the product surface, not a separate vendor.",
    rows: [
      {
        id: "ticket-in-context",
        title: "Tickets in product context",
        body:
          "Support tickets open from any user detail and carry the full session history. No context-switching to a separate Zendesk tab to find what the customer did.",
      },
      {
        id: "shared-data",
        title: "Shared data, scoped writes",
        body:
          "Support can read everything; can write only the fields their role allows. The same typed schema governs both customer and operator actions.",
      },
      {
        id: "csat",
        title: "CSAT and time-to-first-response",
        body:
          "Per-operator response time and customer rating surface in the same dashboard. The data the support manager needs is on the same screen as the team.",
      },
    ],
  },
  {
    id: "automation",
    iconName: "Workflow",
    title: "Automation",
    lead:
      "Background work the operator team sets up once and forgets.",
    rows: [
      {
        id: "background-jobs",
        title: "Background jobs",
        body:
          "Queues and retries wired against the same contract the rest of the app uses. Failed jobs visible in the same dashboard; retries are typed.",
      },
      {
        id: "feature-flags",
        title: "Feature flags",
        body:
          "Per-org, per-plan flag targeting with history. A flag turned off for an enterprise account last Tuesday is still queryable today.",
      },
      {
        id: "scheduled",
        title: "Scheduled tasks",
        body:
          "Cron-style tasks read the same schema, log to the same trace, fail with the same retry policy.",
      },
    ],
  },
] as const

const CLUSTER_MOCKUPS = {
  "auth-and-rbac":     <AuthFlowMockup />,
  "operator-console":  <AdminDashboardMockup />,
  "support-and-tickets": undefined,
  automation:          <ApiEndpointMockup />,
} as const

export default function InternalToolsPage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero */}
      <UseCaseHero
        category="Internal"
        title="Operator consoles behind SSO, on the same contracts."
        body="Admin panels, support inboxes, audit tools. Same Better Auth, same RBAC, same audit trail as the customer-facing app. The four sub-systems an internal tool needs are wired into the registry before your first commit."
        primaryCta={{
          label: "Use it yourself",
          href: "/templates",
        }}
        secondaryCta={{
          label: "Talk to delivery",
          href: "/delivery",
        }}
      />

      {/* 2. What's in the box */}
      <section className="border-b border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-10 lg:px-10 lg:py-12">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            What&apos;s in the box
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            The four sub-systems every internal tool needs.
          </h2>
          <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Eleven capabilities grouped by the buyer-side question
            they answer. Pick a cluster, read what you actually get.
          </p>
        </div>
        <CapabilityClustersSection
          clusters={CAPABILITY_CLUSTERS}
          mockups={CLUSTER_MOCKUPS}
        />
      </section>

      {/* 3. Stack */}
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
            How an internal tool ships.
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
      <section className="flex flex-col border-t border-border">
        <div className="flex flex-col gap-3 px-6 py-10 lg:px-10 lg:py-12 border-b border-border">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Built on this
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            Four templates, each on its own surface.
          </h2>
          <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Production-ready starter templates, each deployed at its
            own URL. Used as the reference set for what the registry
            can ship.
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

      <FinalCta />
    </div>
  )
}
