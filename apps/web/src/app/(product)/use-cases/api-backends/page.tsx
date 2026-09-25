import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { clientEnv } from "@workspace/env/client"

import { UseCaseHero } from "../_components/use-case-page"
import { UseCaseStack } from "../_components/use-case-stack"
import { CopyCommand } from "../_components/copy-command"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

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
  // Resolve the apps/app signup URL server-side. Same convention as
  // /pricing and /use-cases/ai-products (see FinalCta doc).
  const signupHref = new URL("/signup", clientEnv.NEXT_PUBLIC_APP_URL).toString()

  return (
    <div className="border border-border bg-background rounded-none">
        <UseCaseHero
          category="API"
          title="Service-only backends, type-safe end to end."
          body="The same contracts as a full-stack app, with no UI surface. Hono + oRPC + Drizzle, no auth wiring to invent."
          primaryCta={{
            label: "View templates",
            href: "/templates",
          }}
          secondaryCta={{
            label: "Browse templates",
            href: "/templates",
          }}
        />

        <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
          <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Stack
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              What&apos;s wired.
            </h2>
          </div>
          <div className="lg:col-span-4 !p-0 border-0">
            <UseCaseStack items={[...STACK]} />
          </div>
        </div>

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
                <span className="font-mono text-copy-13 text-slate-600 dark:text-slate-400">
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

        <div className="grid grid-cols-1 border-t border-border lg:grid-cols-2 lg:divide-x lg:divide-border">
          <div className="flex flex-col gap-4 p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Get started
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              Pick a template, or have us build the API for you.
            </h2>
            <CopyCommand command="deessejs init --help" className="mt-2" />
          </div>
        </div>

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

        {/* Final CTA — closing shared-border block (noBorderB) */}
        <FinalCta signupHref={signupHref} />
      </div>
  )
}
