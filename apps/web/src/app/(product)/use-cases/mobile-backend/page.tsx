import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { clientEnv } from "@workspace/env/client"

import { UseCaseHero } from "../_components/use-case-page"
import { UseCaseStack } from "../_components/use-case-stack"
import { CopyCommand } from "../_components/copy-command"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

export const metadata: Metadata = {
  title: "Mobile backend | DeesseJS",
  description:
    "Auth, sync, and push notifications for native apps, on the same backend.",
}

const STACK = ["Hono", "Better Auth", "Resend", "Expo (optional)"] as const

const STEPS = [
  {
    heading: "Same auth, same contracts",
    body: "Better Auth issues session tokens your native client validates against the same public keys. No separate identity store.",
  },
  {
    heading: "Wire sync to your existing schema",
    body: "Drizzle models the offline cache shape on the client and the source of truth on the server. No glue code.",
  },
  {
    heading: "Push and analytics, wired",
    body: "Observability traces from the mobile client land in the same dashboard as your web traces. Push notifications route through your existing queue.",
  },
] as const

const RELATED = [
  {
    slug: "api-backends",
    title: "API backends",
    tagline:
      "Service-only backends with type-safe RPC and zero frontend overhead.",
  },
  {
    slug: "saas-apps",
    title: "SaaS apps",
    tagline:
      "Multi-tenant B2B SaaS with auth, billing, and a working dashboard on day one.",
  },
  {
    slug: "ai-products",
    title: "AI products",
    tagline:
      "RAG, chat, and agents wired against the same contracts your app uses.",
  },
] as const

export default function MobileBackendPage() {
  // Resolve the apps/app signup URL server-side. See FinalCta doc.
  const signupHref = new URL("/signup", clientEnv.NEXT_PUBLIC_APP_URL).toString()

  return (
    <div className="border border-border bg-background rounded-none">
        <UseCaseHero
          category="Mobile"
          title="The same backend, with a transport that fits the client."
          body="JSON or gRPC over the same contracts the web app uses. No separate mobile auth flow to maintain."
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
                <span className="font-mono text-copy-13 text-cyan-700 dark:text-cyan-400">
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
              Build the mobile backend with us.
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
