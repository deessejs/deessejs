import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { UseCaseHero } from "../_components/use-case-page"
import { UseCaseStack } from "../_components/use-case-stack"
import { CopyCommand } from "../_components/copy-command"
import { resolveCapabilities } from "../_data"

export const metadata: Metadata = {
  title: "Internal tools | DeesseJS",
  description:
    "Admin dashboards and operator consoles that work behind SSO.",
}

const STACK = [
  "Next.js",
  "Better Auth",
  "TanStack Table",
  "shadcn/ui",
] as const

const STEPS = [
  {
    heading: "Auth behind the same wall",
    body: "Better Auth on the admin subdomain. SSO and roles already wired against your user table.",
  },
  {
    heading: "Operators see what they should",
    body: "Scoped roles, audit log, and rate limits. The same contract that gates your customer app gates your support console.",
  },
  {
    heading: "No second codebase to maintain",
    body: "The operator console consumes the same Drizzle schema and the same Better Auth sessions as the customer surface.",
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

export default function InternalToolsPage() {
  const capabilities = resolveCapabilities("internal-tools")
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="flex flex-col gap-12">
        <UseCaseHero
          category="Internal"
          title="Operator consoles behind SSO, on the same contracts."
          primaryCta={{
            label: "Browse templates",
            href: "/templates",
          }}
          capabilities={capabilities}
        />

        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-3 border-b border-border p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Stack
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              What&apos;s wired.
            </h2>
          </div>
          <div className="!p-0 border-0">
            <UseCaseStack items={[...STACK]} />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-3 border-b border-border p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Process
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              What shipping looks like.
            </h2>
          </div>
          <ol className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
            {STEPS.map((step, idx) => (
              <li
                key={step.heading}
                className="flex flex-col gap-3 p-6 lg:p-8"
              >
                <span className="font-mono text-copy-13 text-zinc-600 dark:text-zinc-400">
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

        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-4 p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Get started
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              Build the operator console with us.
            </h2>
            <CopyCommand command="deessejs init --help" className="mt-2" />
          </div>
        </div>

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
