import Link from "next/link"
import { ArrowRight, Bot, LayoutTemplate, Rocket } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Marketing homepage at `/`. Renders the surface a first-time
 * visitor sees when they land on deessejs.com — the same one
 * that drives the brand explainer, the registry, the knowledge
 * base, and the use-case pages.
 *
 * Sections, top to bottom:
 *   1. Hero: slogan + value prop + dual CTA
 *   2. Featured Templates: 3 spotlighted slugs from the registry
 *   3. Manifesto teaser: pull-quote + CTA into /manifesto
 *   4. Knowledge Base teaser: 3 featured guides
 *   5. Use cases band: 7 outcome clusters linking to /use-cases/[slug]
 *   6. Closing CTA: two primary actions
 *
 * Data is hard-coded here for V1. The pages linked from each
 * section fetch their own data via ISR — the home page stays
 * a thin shell. When content volumes grow, the constants
 * move to a dedicated data module and the homepage shell
 * stays a server component.
 */

const FEATURED_TEMPLATES: ReadonlyArray<{
  slug: string
  name: string
  category: string
  blurb: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    slug: "saas-starter",
    name: "SaaS Starter",
    category: "saas",
    blurb:
      "Next.js + Better Auth + Postgres + Drizzle, wired and tested.",
    icon: Rocket,
  },
  {
    slug: "ai-chatbot",
    name: "AI Chatbot",
    category: "ai",
    blurb:
      "Streaming AI agent with a typed tool registry and persistence.",
    icon: Bot,
  },
  {
    slug: "landing-page",
    name: "Landing Page",
    category: "landing",
    blurb:
      "Astro + Tailwind + shadcn blocks, tuned for B2B conversion.",
    icon: LayoutTemplate,
  },
]

const FEATURED_GUIDES: ReadonlyArray<{
  slug: string
  title: string
  body: string
}> = [
  {
    slug: "install-deessejs-cli",
    title: "Install the deessejs CLI",
    body: "Set up the CLI, authenticate, and discover templates in under two minutes.",
  },
  {
    slug: "first-agent-stack",
    title: "Build your first agent stack",
    body: "Compose an AI agent with a typed tool registry in one afternoon.",
  },
  {
    slug: "deploy-to-vercel",
    title: "Deploy to Vercel",
    body: "From git push to a production build with env vars and a custom domain.",
  },
]

const USE_CASES: ReadonlyArray<{ slug: string; label: string }> = [
  { slug: "saas-apps", label: "SaaS apps" },
  { slug: "ai-products", label: "AI products" },
  { slug: "landing-pages", label: "Landing pages" },
  { slug: "api-backends", label: "API backends" },
  { slug: "internal-tools", label: "Internal tools" },
  { slug: "open-source", label: "Open source" },
  { slug: "mobile-backend", label: "Mobile backend" },
]

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 py-16 sm:px-6 lg:gap-32 lg:py-24">
      {/* 1. Hero */}
      <section className="flex flex-col items-center gap-6 pt-12 text-center lg:pt-24">
        <Badge asChild variant="outline">
          <Link href="/blog/getting-started" className="flex items-center gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-green-500" aria-hidden />
            Getting Started with DeesseJS
            <ArrowRight className="size-3 shrink-0" aria-hidden />
          </Link>
        </Badge>
        <h1 className="text-heading-48 sm:text-heading-64 lg:text-heading-72 font-extrabold tracking-tighter text-balance max-w-5xl">
          Your coding agent should ship from contracts, not from scratch.
        </h1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0">
          DeesseJS is a registry of Next.js SaaS templates with the
          contracts already wired — auth, billing, jobs, storage. Your
          agent reads them, builds on them, can&apos;t break them.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/knowledge-base/guide/install-deessejs-cli">
              Install the CLI
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/templates">Browse templates</Link>
          </Button>
        </div>
        <pre className="mt-4 rounded-md border border-border bg-muted/40 px-4 py-2 text-copy-14-mono text-foreground">
          <code>npm install -g @deessejs/cli@latest</code>
        </pre>
      </section>

      <Separator />

      {/* 2. Featured Templates */}
      <section className="flex flex-col gap-6">
        <header className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              From the registry
            </p>
            <h2 className="text-heading-32 tracking-tight">
              Pick a starter. Ship today.
            </h2>
          </div>
          <Link
            href="/templates"
            className="text-label-14 text-foreground underline-offset-4 hover:underline shrink-0"
          >
            All templates &rarr;
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURED_TEMPLATES.map((template) => {
            const Icon = template.icon
            return (
              <Link
                key={template.slug}
                href={`/templates/${template.slug}`}
                className="group"
              >
                <Card className="flex h-full flex-col gap-3 rounded-sm p-4 transition-colors group-hover:bg-accent/50">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="self-start">
                      {template.category}
                    </Badge>
                    <Icon className="text-muted-foreground size-5 shrink-0" aria-hidden />
                  </div>
                  <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                    {template.name}
                  </h3>
                  <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
                    {template.blurb}
                  </p>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <Separator />

      {/* 3. Manifesto teaser */}
      <section className="mx-auto flex max-w-3xl flex-col gap-6 text-center">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Why we build this
        </p>
        <blockquote className="text-heading-32 tracking-tight text-balance">
          &ldquo;If a template can&apos;t be navigated by a coding
          agent, it isn&apos;t done.&rdquo;
        </blockquote>
        <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          DeesseJS is the main app of a small team building the
          templates, contracts, and tooling we wished existed when
          we shipped our last product.
        </p>
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/manifesto">Read the manifesto</Link>
          </Button>
        </div>
      </section>

      <Separator />

      {/* 4. Knowledge Base teaser */}
      <section className="flex flex-col gap-6">
        <header className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Learn by doing
            </p>
            <h2 className="text-heading-32 tracking-tight">
              Knowledge Base
            </h2>
          </div>
          <Link
            href="/knowledge-base"
            className="text-label-14 text-foreground underline-offset-4 hover:underline shrink-0"
          >
            All guides &rarr;
          </Link>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURED_GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/knowledge-base/guide/${guide.slug}`}
              className="group"
            >
              <Card className="flex h-full flex-col gap-2 p-6 transition-colors group-hover:bg-accent/30">
                <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                  {guide.title}
                </h3>
                <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                  {guide.body}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Separator />

      {/* 5. Use cases band */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Build with DeesseJS
          </p>
          <h2 className="text-heading-32 tracking-tight">
            What you ship with it.
          </h2>
        </header>
        <div className="flex flex-wrap gap-2">
          {USE_CASES.map((useCase) => (
            <Link
              key={useCase.slug}
              href={`/use-cases/${useCase.slug}`}
              className={cn(
                "rounded-md border border-border px-4 py-2 text-label-14 text-foreground transition-colors hover:bg-accent/30",
              )}
            >
              {useCase.label}
            </Link>
          ))}
        </div>
      </section>

      <Separator />

      {/* 6. Closing CTA */}
      <section className="flex flex-col items-center gap-6 text-center">
        <h2 className="text-heading-40 tracking-tight">
          Ready to ship?
        </h2>
        <p className="text-muted-foreground text-copy-18 leading-7 max-w-xl [&:not(:first-child)]:mt-0">
          Bootstrap a working SaaS, AI, or landing project in under a
          minute.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/templates">Start with a template</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/enterprise">Talk to the team</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}