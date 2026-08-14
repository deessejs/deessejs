import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { H1, H2 } from "@workspace/ui/components/typography"
import { Card } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

type Params = { slug: string }

/**
 * Single source of truth for use-cases content. Hardcoded in
 * this file for V1 — moves to a content source under
 * `apps/web/content/use-cases/` once the editorial pipeline
 * ships. Mirrors the same forward-compatible shape used by
 * /knowledge-base and /templates.
 */
type UseCaseMeta = {
  title: string
  tagline: string
  outcome: string
  stack: ReadonlyArray<string>
  starterSlug?: string
  body: string
}

const USE_CASES: Record<string, UseCaseMeta> = {
  "saas-apps": {
    title: "SaaS apps",
    tagline:
      "Multi-tenant B2B SaaS with auth, billing, and a working dashboard on day one.",
    outcome:
      "A production-grade SaaS starter — auth, billing, orgs, audit log, dashboard — that a team can take to market in days rather than months.",
    stack: [
      "Next.js",
      "Better Auth",
      "Drizzle",
      "Postgres",
      "Stripe",
      "Resend",
    ],
    starterSlug: "saas-starter",
    body:
      "Ship the surface that pays the bills: signup, login, billing, and an operator console. The DeesseJS SaaS template handles the wiring that is hard to get right under deadline pressure — multi-tenant boundaries, rate limiting, transactional email — so the team can spend its time on the part customers will actually see.",
  },
  "ai-products": {
    title: "AI products",
    tagline:
      "RAG, chat, and agents wired against the same contracts your app uses.",
    outcome:
      "An AI surface that streams responses, persists state, and exposes a typed tool registry — without glue code at every layer.",
    stack: [
      "Next.js",
      "AI SDK",
      "OpenAI",
      "pgvector",
      "Resend",
    ],
    starterSlug: "ai-chatbot",
    body:
      "Most AI builds are 60% plumbing: streaming responses, persisting conversation state, indexing documents, exposing tools to the model. DeesseJS's AI templates ship that plumbing wired and tested, so you start with the agent logic instead of the protocol. Type-safe contracts keep retrieval, generation, and tool calls on the same schema as the rest of the app.",
  },
  "landing-pages": {
    title: "Landing pages",
    tagline:
      "High-converting marketing surfaces, tuned for the B2B SaaS shelf.",
    outcome:
      "A landing page that reads as a product, not a brochure — pricing matrix, feature grid, hero that earns the click.",
    stack: ["Astro", "Tailwind", "shadcn blocks"],
    starterSlug: "landing-page",
    body:
      "The landing page is often the first time someone decides whether to trust your product. DeesseJS ships Astro + Tailwind + shadcn blocks wired for B2B conversion: pricing tier matrix, feature grid, FAQ, and a hero that doesn't read like a stock template. The marketing site you're reading right now ships from one of these.",
  },
  "api-backends": {
    title: "API backends",
    tagline:
      "Service-only backends — Hono + oRPC, typed end to end, no frontend overhead.",
    outcome:
      "A pure HTTP API with type-safe RPC, contracts published for clients, and zero React in the dependency graph.",
    stack: ["Hono", "oRPC", "Drizzle", "Postgres"],
    body:
      "When the frontend is separate — native apps, partner integrations, embedded dashboards — you still want the same type-safety and contract guarantees. DeesseJS's API surface is a Hono + oRPC stack with the same shared contracts the marketing app consumes, so the wire format is the source of truth, not the local types.",
  },
  "internal-tools": {
    title: "Internal tools",
    tagline:
      "Admin dashboards and operator consoles that work behind SSO.",
    outcome:
      "Operator-facing surfaces with audit logs, bulk actions, and the same auth boundary as your customer app.",
    stack: [
      "Next.js",
      "Better Auth",
      "TanStack Table",
      "shadcn/ui",
    ],
    body:
      "Internal tools get deprioritized right until the moment a customer asks 'how do I change my plan' and the answer is 'open the database'. DeesseJS's admin template ships the operator console with the same auth and contracts as the customer surface — so the support team operates inside the same model the engineering team ships.",
  },
  "open-source": {
    title: "Open source",
    tagline:
      "Maintainer-friendly starters, MIT-licensed, versioned through the same registry.",
    outcome:
      "A starter your community can fork, install, and contribute back to — without inventing conventions from scratch.",
    stack: [
      "MIT license",
      "Public roadmap",
      "CHANGELOG-driven releases",
      "Accepted templates registry",
    ],
    body:
      "Open source templates need the boring things to be right: a license, a changelog, a public roadmap, a way to install that doesn't depend on a private toolchain. DeesseJS ships all of that. Maintainers ship a template; users install with `deessejs init`; updates flow back via the same registry.",
  },
  "mobile-backend": {
    title: "Mobile backend",
    tagline:
      "Auth, sync, and push notifications for native apps — without re-building what you already shipped.",
    outcome:
      "An open BaaS pattern that reuses your DeesseJS auth, contracts, and observability, even when the client is iOS or Android.",
    stack: ["Hono", "Better Auth", "Resend", "Expo (optional)"],
    body:
      "Native mobile apps don't need a new backend — they need the same backend, with a transport that fits their client. DeesseJS's API surface is the BaaS layer; the same auth, the same contracts, the same logs. The mobile client consumes what the web app consumes, with different shapes on the wire.",
  },
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> => {
  const { slug } = await params
  const meta = USE_CASES[slug]
  if (!meta) return { title: "Use case not found" }
  return { title: meta.title, description: meta.tagline }
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const meta = USE_CASES[slug]
  if (!meta) notFound()

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-16 sm:px-6 lg:py-24">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{meta.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-4">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Use case
        </p>
        <H1>{meta.title}</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-3xl [&:not(:first-child)]:mt-0">
          {meta.tagline}
        </p>
      </header>

      <Separator />

      <section className="flex flex-col gap-3">
        <H2>Outcome</H2>
        <p className="text-copy-16 text-foreground leading-7 [&:not(:first-child)]:mt-0">
          {meta.outcome}
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <H2>Stack</H2>
        <Card className="flex flex-col gap-3 p-6">
          <ul className="flex flex-wrap gap-2">
            {meta.stack.map((item) => (
              <li
                key={item}
                className="rounded-md border border-border bg-muted/40 px-3 py-1 text-copy-13 text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <H2>What shipping looks like</H2>
        <p className="text-copy-16 text-foreground leading-7 [&:not(:first-child)]:mt-0">
          {meta.body}
        </p>
      </section>

      <Separator />

      <section className="flex flex-col items-start gap-4">
        <H2>Get started</H2>
        <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          {meta.starterSlug
            ? `The closest template in the registry today is "${meta.starterSlug}". Install it with the CLI:`
            : "Pick a template that matches this use case and start:"}
        </p>
        {meta.starterSlug ? (
          <pre className="rounded-md border border-border bg-muted/40 px-4 py-3 text-copy-14-mono text-foreground">
            deessejs init {meta.starterSlug}
          </pre>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/templates/${meta.starterSlug ?? ""}`}>
              View template
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/templates">All templates</Link>
          </Button>
        </div>
      </section>
    </article>
  )
}