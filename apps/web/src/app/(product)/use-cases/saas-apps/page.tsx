import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { UseCaseHero } from "../_components/use-case-page"
import { UseCaseStack } from "../_components/use-case-stack"
import { CopyCommand } from "../_components/copy-command"
import { resolveCapabilities } from "../_data"

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
  const capabilities = resolveCapabilities("saas-apps")
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="flex flex-col gap-12">
        <UseCaseHero
          category="SaaS"
          title="Ship a SaaS that ships the surface customers pay for."
          status="shipped"
          primaryCta={{
            label: "View saas-starter",
            href: "/templates/saas-starter",
          }}
          capabilities={capabilities}
        />

        {/* Stack */}
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-3 border-b border-border p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Stack
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              What&apos;s wired on day one.
            </h2>
          </div>
          <div className="!p-0 border-0">
            <UseCaseStack items={[...STACK]} />
          </div>
        </div>

        {/* Process */}
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-3 border-b border-border p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Process
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              What shipping looks like.
            </h2>
          </div>
          <ol className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0 md:divide-y-0">
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

        {/* Customer proof */}
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-border">
            <div className="flex flex-col gap-3 border-b border-border p-6 md:border-b-0 md:p-10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-copy-13 text-amber-700 dark:text-amber-400">
                  Placeholder
                </span>
                <span className="text-label-12 text-muted-foreground">
                  Replaced as the pilot cohort grows
                </span>
              </div>
              <blockquote className="flex flex-col gap-4">
                <p className="text-balance text-copy-18 leading-7 text-foreground">
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
            </div>
            <div className="flex flex-col gap-3 p-6 md:p-10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-copy-13 text-amber-700 dark:text-amber-400">
                  Placeholder
                </span>
                <span className="text-label-12 text-muted-foreground">
                  Replaced as the pilot cohort grows
                </span>
              </div>
              <blockquote className="flex flex-col gap-4">
                <p className="text-balance text-copy-18 leading-7 text-foreground">
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
        </div>

        {/* CTA */}
        <div className="overflow-hidden rounded-lg border border-border">
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

        {/* Related */}
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-3 border-b border-border p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Explore
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              Related use cases.
            </h2>
          </div>
          <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
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
