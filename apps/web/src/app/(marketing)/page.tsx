import Link from "next/link"
import { ArrowRight, Bot, LayoutTemplate, Rocket } from "lucide-react"

import { getAllReleases } from "@/lib/blog/releases"
import { allKbGuides } from "content-collections"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"


/**
 * Marketing homepage at `/`. Renders the surface a first-time
 * visitor sees when they land on deessejs.com — the same one
 * that drives the brand explainer, the registry, the knowledge
 * base, and the changelog.
 *
 * Sections, top to bottom:
 *   1. Hero: blog badge + value prop + dual CTA + install snippet
 *   2. Featured Templates: 3 spotlighted slugs from the registry
 *   3. Authority: manifesto quote, KB guides, changelog, stack
 *   4. Cloud: subtle link to the dashboard
 *
 * KB guides and changelog releases are pulled live from
 * `content-collections`. The rest is hard-coded here for V1.
 * When content volumes grow, the constants move to a dedicated
 * data module and the homepage shell stays a server component.
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

const STACK_BADGES: ReadonlyArray<string> = [
  "Next.js",
  "Better Auth",
  "Drizzle",
  "Postgres",
  "Tailwind v4",
  "shadcn",
  "Motion",
  "TypeScript",
]

export default function HomePage() {
  const featuredGuides = allKbGuides.slice(0, 3)
  const releases = getAllReleases().slice(0, 3)

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
        <h1 className="text-heading-48 sm:text-heading-64 lg:text-heading-72 font-bold tracking-tighter text-balance max-w-5xl">
          Your coding agent should ship from contracts, not from scratch.
        </h1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0">
          DeesseJS is a registry of Next.js SaaS templates with the
          contracts already wired — auth, billing, jobs, storage. Your
          agent reads them, builds on them, can&apos;t break them.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/knowledge-base/guides/install-deessejs-cli">
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

      <div className="border-t border-border" />

      {/* 2. Featured Templates */}
      <section className="flex flex-col gap-6">
        <header className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-label-13 text-muted-foreground">
              From the registry
            </p>
            <h2 className="text-heading-32 tracking-tight">
              Pick a starter. Ship today.
            </h2>
          </div>
          <Link
            href="/templates"
            className="text-label-14 text-foreground underline-offset-4 hover:underline inline-flex items-center gap-1 shrink-0"
          >
            All templates
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </header>

        <div className="divide-border grid grid-cols-1 divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
          {FEATURED_TEMPLATES.map((template) => {
            const Icon = template.icon
            return (
              <Link
                key={template.slug}
                href={`/templates/${template.slug}`}
                className="group"
              >
                <Card className="bg-background flex h-full flex-col gap-3 rounded-none p-4 transition-colors group-hover:bg-accent/50">
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

      <div className="border-t border-border" />

      {/* 3. Authority */}
      <section className="flex flex-col gap-12">
        {/* Manifesto quote */}
        <div className="mx-auto flex max-w-3xl flex-col gap-6 text-center">
          <p className="text-label-13 text-muted-foreground">
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
        </div>

        {/* KB + Changelog side-by-side */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {/* Knowledge Base */}
          <div className="flex flex-col gap-6">
            <header className="flex items-end justify-between gap-4">
              <p className="text-label-13 text-muted-foreground">
                Learn by doing
              </p>
              <Link
                href="/knowledge-base"
                className="text-label-14 text-foreground underline-offset-4 hover:underline inline-flex items-center gap-1 shrink-0"
              >
                All guides
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </header>
            <div className="divide-border flex flex-col divide-y">
              {featuredGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={guide.url}
                  className="group py-3 transition-colors hover:bg-accent/50"
                >
                  <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                    {guide.title}
                  </h3>
                  <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-1">
                    {guide.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Changelog */}
          <div className="flex flex-col gap-6">
            <header className="flex items-end justify-between gap-4">
              <p className="text-label-13 text-muted-foreground">
                Recent changes
              </p>
              <Link
                href="/changelog"
                className="text-label-14 text-foreground underline-offset-4 hover:underline inline-flex items-center gap-1 shrink-0"
              >
                All releases
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </header>
            <div className="divide-border flex flex-col divide-y">
              {releases.map((release) => (
                <Link
                  key={release.slug}
                  href={release.url}
                  className="group flex items-baseline justify-between gap-4 py-3 transition-colors hover:bg-accent/50"
                >
                  <span className="text-copy-13-mono text-muted-foreground">
                    v{release.version}
                  </span>
                  <span className="text-heading-20 tracking-tight text-foreground flex-1 !m-0">
                    {release.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stack badges */}
        <div className="flex flex-col gap-4">
          <p className="text-label-13 text-muted-foreground text-center">
            Built on
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {STACK_BADGES.map((badge) => (
              <Badge key={badge} variant="outline">
                {badge}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* 4. Cloud */}
      <section className="flex flex-col items-center gap-4 text-center">
        <Link
          href="/dashboard"
          className="text-label-14 text-foreground underline-offset-4 hover:underline inline-flex items-center gap-2"
        >
          Sign in to your dashboard
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </section>
    </div>
  )
}