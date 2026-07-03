import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Code2, Mail, MessageCircle } from "lucide-react"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardDescription,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import { Separator } from "@workspace/ui/components/ui/separator"

import { HomeFooter } from "@/components/footers/home-footer"
import { WEB_URL } from "@/lib/urls"

export const metadata: Metadata = {
  title: "About — DeesseJS",
  description:
    "DeesseJS is a SaaS starter built for the agentic era. We build the template our agents run on.",
  alternates: {
    canonical: "/about",
  },
}

const bodyContainerClass = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
const sectionPadding = "py-24 sm:py-32"

const principles = [
  {
    title: "Restraint over decoration",
    body: "Mono design language. Hairline borders beat shadows. We ship less, more carefully.",
  },
  {
    title: "Modular by default",
    body: "Every package is removable. No half-built features. The buyer keeps what they use, drops what they don't.",
  },
  {
    title: "Type-safe end-to-end",
    body: "From database to client, the type is the contract. Hono + oRPC + Drizzle. No codegen step.",
  },
  {
    title: "Agents are first-class users",
    body: "Every surface has a tool an agent can call. Auth, billing, jobs, storage, notifications, API.",
  },
  {
    title: "Own every line",
    body: "Self-hosted by default. No vendor lock-in. Your code, your infrastructure, your call.",
  },
  {
    title: "Ship in days, not months",
    body: "Auth, billing, jobs, storage wired on day one. The boilerplate is done before the first commit.",
  },
]

const convictions = [
  {
    title: "To ship agents",
    body: "Agents do their best work on infrastructure that fits how they work — typed, wired, and ready to invoke.",
  },
  {
    title: "For coding agents",
    body: "Shipping an agent should be as simple as shipping a site. A new repo, a new agent, a new product.",
  },
  {
    title: "Built by humans",
    body: "Humans design the system. Agents run on it. The split is intentional and load-bearing.",
  },
]

const milestones = [
  {
    period: "2026 H1",
    title: "DeesseJS v1.0 — public beta",
    body: "Full template shipped: auth, billing, jobs, storage, API, AGENTS.md, Fumadocs docs, Figma UI Kit.",
    status: "shipped",
  },
  {
    period: "2026 H2",
    title: "DeesseJS Lite — open-source subset",
    body: "MIT-licensed free tier. Auth + billing + agent primitives. Try before you buy.",
    status: "shipped",
  },
  {
    period: "2026 Q3",
    title: "DeesseJS Cloud — private beta",
    body: "Managed hosting for your agents. We operate the infrastructure; you ship the product.",
    status: "in-progress",
  },
  {
    period: "2026 Q4",
    title: "Multi-tenant LLM metering + agent workflow library",
    body: "Per-tenant usage dashboards and the canonical library of agent-callable workflows.",
    status: "planned",
  },
]

export default function AboutPage() {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${WEB_URL}/#person`,
    name: "David Pereira",
    alternateName: "dpereira",
    description:
      "Founder of DeesseJS. Building the SaaS template he wished he had three projects ago.",
    url: `${WEB_URL}/about`,
    sameAs: ["https://github.com/codewizdave"],
    worksFor: {
      "@type": "Organization",
      "@id": `${WEB_URL}/#organization`,
    },
  };

  return (
    <div className="flex min-h-screen flex-col selection:bg-foreground selection:text-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <main className="flex-1 border-x border-border/40 mx-auto w-full max-w-[1400px]">
        {/* 1. Hero */}
        <section className={`border-b border-border/40 ${sectionPadding}`}>
          <div className={bodyContainerClass}>
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
                We build the template our agents run on.
              </h1>
              <p className="mt-6 text-pretty text-lg text-muted-foreground">
                DeesseJS is a SaaS starter optimized for the agentic era. Every
                surface your AI agents need — auth, billing, jobs, storage,
                notifications — ships wired from day one. The agents are the
                executors, not just the users.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Mission — Why we built this */}
        <section className={`border-b border-border/40 ${sectionPadding}`}>
          <div className={bodyContainerClass}>
            <div className="mx-auto max-w-2xl">
              <h2 className="text-balance text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
                Why we built this
              </h2>
              <div className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
                <p>
                  Most SaaS templates optimize AI for the developer — Claude
                  Code, Cursor, Codex integration. We optimize the system for
                  AI agents. Your agents don&apos;t just help you code. They
                  run on DeesseJS, call the tools directly, and build your
                  product while you sleep.
                </p>
                <p>
                  We believe the next decade of software will be built by
                  agents running on production-grade infrastructure. The SaaS
                  templates of 2024 gave you auth and billing wiring. The
                  SaaS templates of 2026 need to give you{" "}
                  <span className="text-foreground font-medium">
                    callable surfaces
                  </span>{" "}
                  — every button, every endpoint, every webhook designed so an
                  agent can invoke it without a human in the loop.
                </p>
                <p>
                  DeesseJS is that infrastructure. Not a framework. Not a
                  platform. A complete, wired, type-safe template that ships
                  in minutes and runs anywhere you can deploy Node.
                </p>
              </div>

              {/* Vercel-style bulleted convictions */}
              <div className="mt-12 space-y-6 border-t border-border/40 pt-10">
                {convictions.map((c) => (
                  <div key={c.title}>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {c.title}
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                      {c.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Principles — How we build */}
        <section className={`border-b border-border/40 bg-muted/10 ${sectionPadding}`}>
          <div className={bodyContainerClass}>
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
                How we build
              </h2>
              <p className="mt-4 text-pretty text-base text-muted-foreground">
                Six principles. None are aspirational — every one of them is
                load-bearing in the codebase.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {principles.map((p, i) => (
                <Card
                  key={p.title}
                  className="flex flex-col rounded-lg border bg-background p-6 shadow-sm"
                >
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <CardTitle className="mt-3 text-base font-semibold tracking-tight text-foreground">
                    {p.title}
                  </CardTitle>
                  <Separator className="my-4 bg-border" />
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                    {p.body}
                  </CardDescription>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Company — Who's behind this */}
        <section className={`border-b border-border/40 ${sectionPadding}`}>
          <div className={bodyContainerClass}>
            <div className="mx-auto max-w-2xl">
              <h2 className="text-balance text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
                Who&apos;s behind this
              </h2>
              <div className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
                <p>
                  DeesseJS is built by{" "}
                  <span className="text-foreground font-medium">Nesalia Inc.</span>
                  , a small team focused on agentic infrastructure.
                </p>
                <p>
                  Based across Europe and North America. Async-first. We ship
                  from a single GitHub repo, and every architectural decision
                  is documented in our internal docs. We&apos;d rather show
                  our work than sell you on it.
                </p>
                <p>
                  Not a platform company. Not chasing a billion-dollar exit.
                  Building the best template for solo founders and small
                  teams shipping SaaS in the next 12 months — and getting
                  back to work.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Roadmap — Where we're going */}
        <section className={`border-b border-border/40 bg-muted/10 ${sectionPadding}`}>
          <div className={bodyContainerClass}>
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
                Where we&apos;re going
              </h2>
              <p className="mt-4 text-pretty text-base text-muted-foreground">
                What shipped, what&apos;s in flight, what&apos;s planned.
                Quarterly updates, no surprises.
              </p>
            </div>
            <div className="mx-auto max-w-3xl">
              <ol className="space-y-0">
                {milestones.map((m, i) => (
                  <li
                    key={m.title}
                    className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 border-t border-border/40 py-6 first:border-t-0"
                  >
                    <div className="flex flex-col items-start gap-1 pt-1">
                      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        {m.period}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          m.status === "shipped"
                            ? "bg-foreground text-background"
                            : m.status === "in-progress"
                              ? "border border-foreground/40 text-foreground"
                              : "border border-border/60 text-muted-foreground"
                        }`}
                      >
                        {m.status === "shipped"
                          ? "Shipped"
                          : m.status === "in-progress"
                            ? "In progress"
                            : "Planned"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">
                        {m.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {m.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 6. Get in touch */}
        <section className={`relative overflow-hidden ${sectionPadding}`}>
          <div className="absolute left-1/2 top-1/2 -z-10 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[100px] bg-foreground/20 rounded-full pointer-events-none" />
          <div className={bodyContainerClass}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
                Stay close
              </h2>
              <p className="mt-4 text-pretty text-base text-muted-foreground">
                We ship in public. Read the code, follow the work, or just
                say hi.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-3">
              <Link
                href="https://github.com/nesalia-inc"
                className="group flex flex-col items-center gap-3 rounded-lg border bg-background p-6 shadow-sm transition-colors hover:border-foreground/30"
              >
                <Code2 className="size-5 text-foreground" aria-hidden />
                <span className="text-sm font-semibold text-foreground">
                  GitHub
                </span>
                <span className="text-xs text-muted-foreground">
                  Read the code
                </span>
              </Link>
              <Link
                href="https://community.nesalia.com"
                className="group flex flex-col items-center gap-3 rounded-lg border bg-background p-6 shadow-sm transition-colors hover:border-foreground/30"
              >
                <MessageCircle
                  className="size-5 text-foreground"
                  aria-hidden
                />
                <span className="text-sm font-semibold text-foreground">
                  Discord
                </span>
                <span className="text-xs text-muted-foreground">
                  Join the community
                </span>
              </Link>
              <Link
                href="mailto:founders@deessejs.com"
                className="group flex flex-col items-center gap-3 rounded-lg border bg-background p-6 shadow-sm transition-colors hover:border-foreground/30"
              >
                <Mail className="size-5 text-foreground" aria-hidden />
                <span className="text-sm font-semibold text-foreground">
                  Email
                </span>
                <span className="text-xs text-muted-foreground">
                  founders@deessejs.com
                </span>
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-full px-8 text-base font-semibold shadow-md transition-transform hover:scale-105"
                nativeButton={false}
                render={<Link href="/pricing" />}
              >
                See pricing
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 rounded-full px-8 text-base font-medium shadow-sm backdrop-blur-md"
                nativeButton={false}
                render={<Link href="/docs" />}
              >
                Read the docs
              </Button>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  )
}