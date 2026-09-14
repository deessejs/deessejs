import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Boxes, Database, GitBranch, LineChart, Mail } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

import { UseCaseHero } from "../_components/use-case-page"
import { UseCaseStack } from "../_components/use-case-stack"
import { CopyCommand } from "../_components/copy-command"
import {
  AdminDashboardMockup,
  ApiEndpointMockup,
  AuthFlowMockup,
  BillingWidgetMockup,
  CmsEditorMockup,
  DbTerminalMockup,
  MultiTenantSwitcherMockup,
} from "../_components/mockups"

export const metadata: Metadata = {
  title: "SaaS apps | DeesseJS",
  description:
    "Multi-tenant B2B SaaS with auth, billing, and a working dashboard on day one.",
}

const STACK = [
  "Next.js",
  "Better Auth",
  "Drizzle",
  "Postgres",
  "Stripe",
  "Resend",
] as const

const STEPS = [
  {
    heading: "Scaffold the project",
    body: "Run the CLI. The contracts are wired before the first file is generated. Multi-tenant boundaries, rate limiting, and transactional email come preconfigured.",
  },
  {
    heading: "Wire your domain",
    body: "Replace the placeholder with the product. The six contracts stay stable, so the surface you ship to customers is the only thing that changes.",
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
 * "And more" tiles for capabilities that don't get their own full
 * simulation section. Each tile = icon + title + 1-line description
 * + status badge. Same shape as the home ecosystem grid but denser.
 */
type MoreTile = {
  id: string
  title: string
  description: string
  status: "shipped" | "roadmap"
  shippedAt?: string
  icon: React.ComponentType<{ className?: string }>
}

const AND_MORE: ReadonlyArray<MoreTile> = [
  { id: "multi-tenant",  title: "Multi-tenant",    description: "Workspaces + orgs",                 status: "roadmap", shippedAt: "Q4 2026", icon: Boxes },
  { id: "admin",         title: "Admin dashboard", description: "Operator console",                 status: "roadmap", shippedAt: "Q1 2027", icon: GitBranch },
  { id: "background",    title: "Background jobs", description: "Queues + retries",                 status: "roadmap", shippedAt: "Q2 2027", icon: LineChart },
  { id: "storage",       title: "Object storage",  description: "S3-compatible",                    status: "shipped",                     icon: Database },
  { id: "email",         title: "Email",           description: "Resend + React Email",             status: "shipped",                     icon: Mail },
  { id: "observability", title: "Observability",   description: "Logs + traces + metrics",          status: "roadmap", shippedAt: "Q1 2027", icon: LineChart },
]

export default function SaasAppsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="border border-border bg-background rounded-none">
        {/* 1. Hero */}
        <UseCaseHero
          category="SaaS"
          title="Ship a SaaS that ships the surface customers pay for."
          status="shipped"
          primaryCta={{
            label: "View saas-starter",
            href: "/templates/saas-starter",
          }}
        />

        {/* 2. Auth simulation */}
        <SimulatedSection
          eyebrow="Auth"
          title="Better Auth, wired end-to-end."
          body="Email + password + magic links + OAuth, with sessions that respect multi-tenant boundaries. The form lives in your app, the contract lives in the registry."
          bullets={[
            "Email + password reset, verified at the proxy",
            "OAuth providers behind the same Better Auth contract",
            "Sessions scoped to orgs, not just users",
          ]}
          mockup={<AuthFlowMockup />}
        />

        {/* 3. Database simulation */}
        <SimulatedSection
          eyebrow="Database"
          title="Drizzle + Postgres, types end-to-end."
          body="Schemas live in `packages/database`, migrations run from the same CLI you ship to customers. Your agent reads the schema the same way your runtime does."
          bullets={[
            "Drizzle Studio included for local inspection",
            "pg-mem for unit tests, no Postgres required",
            "Migration history generated, never hand-edited",
          ]}
          mockup={<DbTerminalMockup />}
          reverse
        />

        {/* 4. API simulation */}
        <SimulatedSection
          eyebrow="API"
          title="Hono + oRPC, the router is the schema."
          body="Define procedures in TypeScript. Clients import the type, the server enforces it. Your agent consumes the contract, not the implementation."
          bullets={[
            "End-to-end typed routes, no GraphQL",
            "OpenAPI generated from the router",
            "Auth and rate limits applied per procedure",
          ]}
          mockup={<ApiEndpointMockup />}
        />

        {/* 5. Billing simulation */}
        <SimulatedSection
          eyebrow="Billing"
          title="Stripe subscriptions, ready to ship."
          body="Webhooks, usage metering, and customer portal wired against the same contracts your app uses. The plumbing that takes weeks is done before your first commit."
          bullets={[
            "Customer portal link generated, no extra UI",
            "Usage metering shape matches your contract",
            "Webhook handler typed, ready to extend",
          ]}
          mockup={<BillingWidgetMockup />}
          reverse
        />

        {/* 6. CMS simulation */}
        <SimulatedSection
          eyebrow="CMS"
          title="MDX + taxonomy, blog and docs from day one."
          body="Frontmatter is typed. The body renders through the same component library as the rest of the app. Authors write, agents read, the registry indexes both."
          bullets={[
            "Frontmatter schema generated from the contract",
            "Preview pane matches production render",
            "Taxonomy wired into search and the KB",
          ]}
          mockup={<CmsEditorMockup />}
        />

        {/* 7. Multi-tenant switcher (roadmap Q4) */}
        <SimulatedSection
          eyebrow="Multi-tenant"
          title="Workspaces + orgs, one contract."
          status="roadmap"
          roadmapLabel="Q4 2026"
          body="Switch between workspaces without losing context. Plan tier and member count travel with the org, not the user. The isolation that takes a quarter ships with the registry."
          bullets={[
            "Plan tier per workspace, not per user",
            "Member roles scoped to the org",
            "Audit log records every cross-org call",
          ]}
          mockup={<MultiTenantSwitcherMockup />}
          reverse
        />

        {/* 8. Admin dashboard (roadmap Q1) */}
        <SimulatedSection
          eyebrow="Admin"
          title="Operator console, on the same contracts."
          status="roadmap"
          roadmapLabel="Q1 2027"
          body="MRR, active users, churn at a glance. The user table below is filtered by role and shows last-seen. Same Better Auth sessions as the customer surface."
          bullets={[
            "KPIs roll up from the billing contract",
            "User table filters by role and last-seen",
            "Bulk actions hit the same RPC as the API",
          ]}
          mockup={<AdminDashboardMockup />}
        />

        {/* 9. And more - dense grid of remaining capabilities */}
        <AndMoreSection tiles={AND_MORE} />

        {/* 10. Stack */}
        <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
          <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Stack
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              What&apos;s wired on day one.
            </h2>
          </div>
          <div className="lg:col-span-4 !p-0 border-0">
            <UseCaseStack items={[...STACK]} />
          </div>
        </div>

        {/* 11. Process */}
        <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
          <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Process
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              What shipping looks like.
            </h2>
          </div>
          <ol className="grid grid-cols-1 divide-y divide-border lg:col-span-4 !p-0 border-0 md:grid-cols-3 md:divide-x md:divide-y-0">
            {STEPS.map((step, idx) => (
              <li
                key={step.heading}
                className="flex flex-col gap-3 p-6 lg:p-8"
              >
                <span className="font-mono text-copy-13 text-emerald-600 dark:text-emerald-400">
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

        {/* 12. CTA */}
        <div className="grid grid-cols-1 border-t border-border lg:grid-cols-2 lg:divide-x lg:divide-border">
          <div className="flex flex-col gap-4 p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Get started
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              Run the CLI. The contracts wire themselves.
            </h2>
            <CopyCommand command="deessejs init saas-starter" className="mt-2" />
            <p className="font-mono text-copy-13 text-muted-foreground">
              or run{" "}
              <span className="text-foreground/90">deessejs init --help</span> for the
              full list of templates.
            </p>
          </div>
        </div>

        {/* 13. Related */}
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
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section helpers
// ---------------------------------------------------------------------------

/**
 * A 2-column section: copy on one side, product mockup on the other.
 * Alternates left/right via the `reverse` flag so consecutive sections
 * feel like a zig-zag, not a column.
 *
 * On lg viewports, `reverse=true` swaps the two columns: the copy sits
 * on the right and the mockup sits on the left. The divide-x divider
 * stays between them.
 *
 * On mobile (single column), the mockup appears first so the visitor
 * sees the product before reading the copy. The flex-col-reverse helper
 * on the copy column does that without touching source order.
 *
 * Lives inside the page's shared-border wrapper, so each section
 * ends with a `border-t` (supplied by the parent's grid). The mockup
 * pane owns its own border for visual containment.
 */
function SimulatedSection({
  eyebrow,
  title,
  body,
  bullets,
  mockup,
  reverse = false,
  status = "shipped",
  roadmapLabel,
}: {
  eyebrow: string
  title: string
  body: string
  bullets: ReadonlyArray<string>
  mockup: React.ReactNode
  reverse?: boolean
  status?: "shipped" | "roadmap"
  roadmapLabel?: string
}) {
  return (
    <div className="grid grid-cols-1 border-t border-border lg:grid-cols-2 lg:divide-x lg:divide-border">
      <div
        className={cn(
          // Mobile: copy sits below the mockup
          "order-2 flex flex-col gap-4 p-6 lg:p-10",
          // Desktop: copy on the left by default, on the right when reversed
          reverse ? "lg:order-2" : "lg:order-1",
        )}
      >
        <div className="flex items-center gap-3">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </p>
          {status === "roadmap" ? (
            <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-label-12 text-muted-foreground">
              {roadmapLabel ?? "Roadmap"}
            </span>
          ) : null}
        </div>
        <h2 className="max-w-xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
          {title}
        </h2>
        <p className="max-w-xl text-copy-16 leading-7 text-muted-foreground">
          {body}
        </p>
        <ul className="flex flex-col gap-2">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 text-copy-14 leading-6 text-muted-foreground"
            >
              <span
                aria-hidden
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500"
              />
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div
        className={cn(
          // Mobile: mockup first
          "order-1 !p-0 border-0",
          // Desktop: mockup on the right by default, on the left when reversed
          reverse ? "lg:order-1" : "lg:order-2",
        )}
      >
        <div className="m-4 overflow-hidden rounded-none border border-border bg-background lg:m-6">
          {mockup}
        </div>
      </div>
    </div>
  )
}

/**
 * The "And more" grid: dense 3-col showcase of capabilities that
 * don't get their own simulation. Each tile carries the same status
 * vocabulary as the hero capabilities grid.
 */
function AndMoreSection({ tiles }: { tiles: ReadonlyArray<MoreTile> }) {
  return (
    <div className="border-t border-border">
      <div className="flex flex-col gap-3 border-b border-border p-6 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          And more
        </p>
        <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
          Six more capabilities, wired or on the way.
        </h2>
      </div>
      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-3 lg:!divide-x-0">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <div
              key={tile.id}
              className="flex flex-col gap-3 p-6 lg:p-8"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-7 items-center justify-center rounded-md border border-border bg-muted/40">
                  <Icon className="size-4 text-foreground" aria-hidden />
                </span>
                {tile.status === "shipped" ? (
                  <span className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-label-12 text-emerald-700 dark:text-emerald-300">
                    shipped
                  </span>
                ) : (
                  <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-label-12 text-muted-foreground">
                    {tile.shippedAt ?? "roadmap"}
                  </span>
                )}
              </div>
              <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
                {tile.title}
              </h3>
              <p className="text-copy-14 leading-6 text-muted-foreground">
                {tile.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
