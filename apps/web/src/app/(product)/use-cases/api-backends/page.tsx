import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { UseCaseHero } from "../_components/use-case-page"
import { UseCaseStack } from "../_components/use-case-stack"
import { CopyCommand } from "../_components/copy-command"

export const metadata: Metadata = {
  title: "API backends | DeesseJS",
  description:
    "Service-only backends, Hono + oRPC, typed end to end, no frontend overhead.",
}

const STACK = ["Hono", "oRPC", "Drizzle", "Postgres"] as const

const STEPS = [
  {
    heading: "Define the contract",
    body: "The router is the schema. Clients import the type, the server enforces it.",
  },
  {
    heading: "Wire the storage layer",
    body: "Drizzle on Postgres by default. Swap providers without rewriting the API surface.",
  },
  {
    heading: "Publish and iterate",
    body: "OpenAPI is generated from the router. Clients consume the contract, not the implementation.",
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
    slug: "mobile-backend",
    title: "Mobile backend",
    tagline:
      "Auth, sync, and push notifications for native apps, on the same backend.",
  },
  {
    slug: "ai-products",
    title: "AI products",
    tagline:
      "RAG, chat, and agents wired against the same contracts your app uses.",
  },
] as const

export default function ApiBackendsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="border border-border bg-background rounded-none">
        <UseCaseHero
          category="API"
          title="Service-only backends, type-safe end to end."
          tagline="Hono + oRPC, typed end to end, no frontend overhead. The router is the schema. Clients consume the contract, not the implementation."
          variant="center"
          primaryCta={{
            label: "Talk to delivery",
            href: "/contact",
          }}
          secondaryCta={{
            label: "All templates",
            href: "/templates",
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border border-b border-border">
          <div className="lg:col-span-2 flex flex-col gap-3 justify-center p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Stack
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              What's wired.
            </h2>
          </div>
          <div className="lg:col-span-4 !p-0 border-0">
            <UseCaseStack items={[...STACK]} />
          </div>
        </div>

        <div className="border-b border-border">
          <div className="grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
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
                  <span className="text-copy-13-mono text-slate-600 dark:text-slate-400">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border border-b border-border">
          <div className="lg:col-span-2 flex flex-col gap-4 p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Get started
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Pick a template, or have us build the API for you.
            </h2>
            <CopyCommand command="deessejs init --help" className="mt-2" />
          </div>
          <div className="flex flex-col gap-3 p-6 lg:p-10 bg-slate-500/5">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Or ship with us
            </p>
            <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
              We build the API.
            </h3>
            <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
              Same contracts, different team. You ship to your clients.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-copy-14 text-slate-700 dark:text-slate-400 hover:underline underline-offset-4"
            >
              Talk to delivery
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
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
