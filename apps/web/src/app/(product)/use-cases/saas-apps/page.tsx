import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, TrendingUp, Users, CircleDollarSign } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"

import { UseCaseHero } from "../_components/use-case-page"
import { UseCaseStack } from "../_components/use-case-stack"
import { CopyCommand } from "../_components/copy-command"

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

export default function SaasAppsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="border border-border bg-background rounded-none">
        {/* 1. Hero — split layout with dashboard mockup */}
        <UseCaseHero
          category="SaaS"
          title="Ship a SaaS that ships the surface customers pay for."
          tagline="Multi-tenant B2B SaaS with auth, billing, and a working dashboard on day one. The contracts are wired before the first file is generated."
          variant="split"
          primaryCta={{
            label: "View saas-starter",
            href: "/templates/saas-starter",
          }}
          secondaryCta={{
            label: "Talk to delivery",
            href: "/contact",
          }}
          visual={<DashboardMockup />}
        />

        {/* 2. Outcome — 4 quantified metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          <OutcomeMetric
            icon={<CircleDollarSign className="size-5 text-emerald-600" aria-hidden />}
            value="124+"
            label="hours of plumbing skipped"
          />
          <OutcomeMetric
            icon={<TrendingUp className="size-5 text-emerald-600" aria-hidden />}
            value="6"
            label="contracts wired by default"
          />
          <OutcomeMetric
            icon={<Users className="size-5 text-emerald-600" aria-hidden />}
            value="Org-ready"
            label="multi-tenant from day one"
          />
          <OutcomeMetric
            icon={<ArrowRight className="size-5 text-emerald-600" aria-hidden />}
            value="MIT"
            label="ship it, keep the code"
          />
        </div>

        {/* 3. Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border border-b border-border">
          <div className="lg:col-span-2 flex flex-col gap-3 justify-center p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Stack
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              What's wired on day one.
            </h2>
          </div>
          <div className="lg:col-span-4 !p-0 border-0">
            <UseCaseStack items={[...STACK]} />
          </div>
        </div>

        {/* 4. Process */}
        <div className="grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border border-b border-border">
          <div className="lg:col-span-2 flex flex-col gap-3 justify-center p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Process
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              What shipping looks like.
            </h2>
          </div>
          <ol className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border !p-0 border-0">
            {STEPS.map((step, idx) => (
              <li
                key={step.heading}
                className="flex flex-col gap-3 p-6 lg:p-8"
              >
                <span className="text-copy-13-mono text-emerald-600 dark:text-emerald-400">
                  Step {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
                  {step.heading}
                </h3>
                <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* 5. Customer proof */}
        <div className="border-b border-border">
          <div className="grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
            <div className="lg:col-span-2 flex flex-col gap-3 justify-center p-6 lg:p-10">
              <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
                From teams shipping with DeesseJS
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
                What people say.
              </h2>
            </div>
            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 divide-y divide-border md:divide-y-0 md:divide-x divide-border !p-0 border-0">
              <blockquote className="flex flex-col gap-4 p-6 lg:p-8">
                <p className="text-copy-18 text-foreground leading-7 text-balance [&:not(:first-child)]:mt-0">
                  &ldquo;We swapped three weeks of plumbing for a single{" "}
                  <code className="font-mono text-foreground/90">deessejs init</code>.
                  The contracts layer is the part we wish we&rsquo;d had a year
                  ago.&rdquo;
                </p>
                <footer className="flex items-center gap-3 pt-2">
                  <span
                    aria-hidden
                    className="flex size-9 items-center justify-center rounded-full border border-border bg-muted/40 text-label-13 text-foreground"
                  >
                    FC
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-label-13 text-foreground">
                      First customer
                    </span>
                    <span className="text-label-12 text-muted-foreground">
                      Founder, stealth B2B SaaS
                    </span>
                  </span>
                </footer>
              </blockquote>
              <blockquote className="flex flex-col gap-4 p-6 lg:p-8">
                <p className="text-copy-18 text-foreground leading-7 text-balance [&:not(:first-child)]:mt-0">
                  &ldquo;The agents we ship can actually read the registry now. They
                  navigate the contracts like a developer would. That is the
                  unlock.&rdquo;
                </p>
                <footer className="flex items-center gap-3 pt-2">
                  <span
                    aria-hidden
                    className="flex size-9 items-center justify-center rounded-full border border-border bg-muted/40 text-label-13 text-foreground"
                  >
                    PT
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-label-13 text-foreground">
                      Pilot team
                    </span>
                    <span className="text-label-12 text-muted-foreground">
                      AI tooling, DeesseJS preview
                    </span>
                  </span>
                </footer>
              </blockquote>
            </div>
          </div>
          <p className="text-label-13 text-muted-foreground px-6 py-3 border-t border-border">
            Placeholder quotes. Replaced with attributed quotes as the pilot
            cohort grows.
          </p>
        </div>

        {/* 6. CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
          <div className="flex flex-col gap-3 justify-center p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Get started
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Run the CLI. The contracts wire themselves.
            </h2>
            <CopyCommand command="deessejs init saas-starter" className="mt-2" />
            <p className="text-copy-13-mono text-muted-foreground [&:not(:first-child)]:mt-0">
              or run{" "}
              <span className="text-foreground/90">deessejs init --help</span> for the
              full list of templates.
            </p>
          </div>
          <div className="flex flex-col gap-3 justify-center p-6 lg:p-10 bg-emerald-500/5">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Or ship with us
            </p>
            <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
              We build the first version with you.
            </h3>
            <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
              Same templates, same contracts, same guarantees. You keep the
              code and the contracts at the end.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-copy-14 text-emerald-700 dark:text-emerald-400 hover:underline underline-offset-4"
            >
              Talk to delivery
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>

        {/* 7. Related */}
        <div className="border-t border-border grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
          <div className="lg:col-span-2 flex flex-col gap-3 justify-center p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Explore
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Related use cases.
            </h2>
          </div>
          <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border !p-0 border-0">
            {RELATED.map((item) => (
              <Link
                key={item.slug}
                href={`/use-cases/${item.slug}`}
                className="group flex flex-col gap-2 p-6 lg:p-8 transition-colors hover:bg-accent/40"
              >
                <p className="text-label-13 text-muted-foreground">Related</p>
                <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
                  {item.title}
                </h3>
                <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0 line-clamp-3">
                  {item.tagline}
                </p>
                <p className="text-label-13 text-foreground inline-flex items-center gap-1 pt-1">
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

function OutcomeMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className="flex flex-col gap-2 p-6 lg:p-8">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-foreground [&:not(:first-child)]:mt-0">
          {value}
        </span>
      </div>
      <p className="text-copy-13 text-muted-foreground leading-5 [&:not(:first-child)]:mt-0">
        {label}
      </p>
    </div>
  )
}

function DashboardMockup() {
  return (
    <div className="rounded-lg border border-border bg-background shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="size-2.5 rounded-full bg-red-400/60" aria-hidden />
        <span className="size-2.5 rounded-full bg-amber-400/60" aria-hidden />
        <span className="size-2.5 rounded-full bg-emerald-400/60" aria-hidden />
        <span className="ml-2 text-label-12 font-mono text-muted-foreground">
          app.deessejs.com/dashboard
        </span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
        <DashboardKPI label="MRR" value="$12,847" delta="+8.2%" positive />
        <DashboardKPI label="Active users" value="1,420" delta="+112 / wk" positive />
      </div>
      <div className="p-4">
        <p className="text-label-13 text-muted-foreground mb-3">
          Revenue · last 30 days
        </p>
        <svg
          viewBox="0 0 280 80"
          className="w-full h-20"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="mrr-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 60 L20 56 L40 58 L60 50 L80 52 L100 44 L120 40 L140 36 L160 32 L180 28 L200 24 L220 22 L240 18 L260 16 L280 12"
            fill="none"
            stroke="rgb(16 185 129)"
            strokeWidth="2"
          />
          <path
            d="M0 60 L20 56 L40 58 L60 50 L80 52 L100 44 L120 40 L140 36 L160 32 L180 28 L200 24 L220 22 L240 18 L260 16 L280 12 L280 80 L0 80 Z"
            fill="url(#mrr-gradient)"
          />
        </svg>
        <div className="mt-4 flex items-center gap-2 text-label-13">
          <Badge variant="success" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
            Contracts stable
          </Badge>
          <span className="text-muted-foreground">
            6 wired · 0 missing · 0 outdated
          </span>
        </div>
      </div>
    </div>
  )
}

function DashboardKPI({
  label,
  value,
  delta,
  positive,
}: {
  label: string
  value: string
  delta: string
  positive: boolean
}) {
  return (
    <div className="flex flex-col gap-1 p-4">
      <span className="text-label-13 text-muted-foreground">{label}</span>
      <span className="text-heading-24 lg:text-heading-32 font-medium tracking-tight text-foreground [&:not(:first-child)]:mt-0">
        {value}
      </span>
      <span
        className={
          positive
            ? "text-label-13 text-emerald-600 dark:text-emerald-400"
            : "text-label-13 text-muted-foreground"
        }
      >
        {delta}
      </span>
    </div>
  )
}
