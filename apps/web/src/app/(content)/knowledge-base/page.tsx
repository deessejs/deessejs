import Link from "next/link"
import type { Metadata } from "next"
import { allKbTopics } from "content-collections"

import { Badge } from "@workspace/ui/components/badge"
import { Card } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

import { H1, H2 } from "@workspace/ui/components/typography"

export const metadata: Metadata = {
  title: "Knowledge Base",
  description:
    "In-depth guides, tutorials, and explainers for the DeesseJS ecosystem.",
  robots: { index: false, follow: false },
}

/**
 * Knowledge Base index at /knowledge-base.
 *
 * Vercel-style surface (https://vercel.com/knowledge):
 *
 *   1. Hero — title + tagline + search bar (placeholder)
 *   2. Featured Topics — 3-4 large tiles
 *   3. Featured Guides — 6 highlighted cards
 *   4. All Topics — full grid of subjects
 *   5. All Guides — tag cloud + list of guides
 *   6. CTA strip — "Ready to ship?" block
 *
 * Topic sections read from the kbTopics content-collection
 * (ADR-013). Guide sections are still hard-coded; they
 * move to kbGuides in ADR-014.
 */

const TOPICS = [...allKbTopics].sort((a, b) => a.order - b.order)
const FEATURED_TOPICS = TOPICS.slice(0, 3)

const TOPIC_TAGS = Array.from(
  new Set(TOPICS.flatMap((t) => t.tags)),
).sort()

const FEATURED_GUIDES = [
  {
    slug: "install-deessejs-cli",
    title: "Install the deessejs CLI",
    description:
      "Set up the CLI, authenticate, and discover templates from the registry.",
    products: ["cli", "registry"],
  },
  {
    slug: "first-agent-stack",
    title: "Build your first agent stack",
    description:
      "Compose an AI agent with the SDK, a tool registry, and a streaming endpoint.",
    products: ["agents", "ai-sdk"],
  },
  {
    slug: "deploy-to-vercel",
    title: "Deploy to Vercel",
    description:
      "Connect your repo, configure environments, and run your first production build.",
    products: ["deploy"],
  },
  {
    slug: "nextjs-rag-template",
    title: "Use the Next.js RAG template",
    description:
      "From the templates registry to a streaming chat endpoint with embeddings.",
    products: ["templates", "ai", "postgres"],
  },
  {
    slug: "background-jobs-queue",
    title: "Run background jobs",
    description:
      "Queue and worker patterns for async work outside your request path.",
    products: ["queue"],
  },
  {
    slug: "observability-logging",
    title: "Add observability",
    description:
      "Logs, traces, and metrics — the three signals that catch production issues.",
    products: ["observability"],
  },
] as const

const ALL_TOPICS = TOPICS

const ALL_GUIDES = [
  ...FEATURED_GUIDES,
  {
    slug: "postgres-migrations",
    title: "Manage Postgres migrations",
    description: "Drizzle migrations in CI, rollback, zero-downtime.",
    products: ["database"],
  },
  {
    slug: "shadcn-theming",
    title: "Theme with shadcn tokens",
    description: "Add semantic tokens, dark mode, brand colors.",
    products: ["ui"],
  },
  {
    slug: "production-checklist",
    title: "Production readiness checklist",
    description: "Auth, secrets, observability, rate limits — what to verify.",
    products: ["deploy"],
  },
] as const

const TAG_CLOUD = Array.from(
  new Set(ALL_GUIDES.flatMap((g) => g.products)),
).sort()

export default function KnowledgeBasePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:gap-24 lg:py-24">
      {/* Hero */}
      <header className="flex flex-col items-center gap-6 text-center">
        <H1>Knowledge Base</H1>
        <p className="max-w-2xl text-muted-foreground text-copy-18 leading-7 [&:not(:first-child)]:mt-0">
          In-depth guides, tutorials, and explainers for the
          DeesseJS ecosystem.
        </p>
        <div
          aria-hidden
          className="flex h-12 w-full max-w-2xl items-center justify-center rounded-md border border-border bg-muted/30 text-copy-14 text-muted-foreground/70"
        >
          Search Knowledge Base — coming soon
        </div>
      </header>

      {/* Featured Topics */}
      <section className="flex flex-col gap-6">
        <H2>Featured Topics</H2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURED_TOPICS.map((topic) => (
            <Link
              key={topic.slug}
              href={`/knowledge-base/topics/${topic.slug}`}
              className="group"
            >
              <Card className="flex h-full flex-col gap-3 p-6 transition-colors group-hover:bg-accent/30">
                <span className="text-label-16 font-semibold tracking-tight text-foreground">
                  {topic.title}
                </span>
                <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                  {topic.description}
                </p>
                {topic.tags.length > 0 ? (
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    {topic.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Guides */}
      <section className="flex flex-col gap-6">
        <H2>Featured Guides</H2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURED_GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/knowledge-base/guide/${guide.slug}`}
              className="group"
            >
              <Card className="flex h-full flex-col justify-between gap-4 p-6 transition-colors group-hover:bg-accent/30">
                <div className="flex flex-col gap-2">
                  <span className="text-label-16 font-semibold tracking-tight text-foreground">
                    {guide.title}
                  </span>
                  <p className="text-copy-14 text-muted-foreground leading-7 line-clamp-3 [&:not(:first-child)]:mt-0">
                    {guide.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {guide.products.map((product) => (
                    <Badge key={product} variant="secondary">
                      {product}
                    </Badge>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Topic Tags */}
      {TOPIC_TAGS.length > 0 ? (
        <section className="flex flex-col gap-4">
          <H2>Browse by topic tag</H2>
          <div className="flex flex-wrap gap-2">
            {TOPIC_TAGS.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      {/* All Topics */}
      <section className="flex flex-col gap-6">
        <H2>All Topics</H2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_TOPICS.map((topic) => (
            <Link
              key={topic.slug}
              href={`/knowledge-base/topics/${topic.slug}`}
              className="group"
            >
              <Card className="flex h-full flex-col gap-2 p-6 transition-colors group-hover:bg-accent/30">
                <span className="text-label-16 font-semibold tracking-tight text-foreground">
                  {topic.title}
                </span>
                <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                  {topic.description}
                </p>
                {topic.tags.length > 0 ? (
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    {topic.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* All Guides */}
      <section className="flex flex-col gap-6">
        <H2>All Guides</H2>

        <div className="flex flex-wrap gap-2">
          {TAG_CLOUD.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        <ul className="flex flex-col gap-3">
          {ALL_GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/knowledge-base/guide/${guide.slug}`}
                className="flex flex-col gap-1 rounded-md px-2 py-2 transition-colors hover:bg-accent/30"
              >
                <span className="text-label-16 font-medium text-foreground">
                  {guide.title}
                </span>
                <span className="text-copy-13 text-muted-foreground">
                  {guide.description}
                </span>
                <span className="flex flex-wrap gap-1.5 pt-1">
                  {guide.products.map((product) => (
                    <Badge key={product} variant="secondary">
                      {product}
                    </Badge>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Separator />

      {/* CTA */}
      <section className="flex flex-col items-center gap-3 text-center">
        <H2>Ready to ship?</H2>
        <p className="text-muted-foreground max-w-xl text-copy-16 leading-7 [&:not(:first-child)]:mt-0">
          Spin up your first project from a DeesseJS template in
          under a minute.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/templates"
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-button-14 font-medium text-primary-foreground transition-colors hover:bg-primary/90",
            )}
          >
            Start with a template
          </Link>
          <Link
            href="/enterprise"
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md border border-border px-6 text-button-14 font-medium text-foreground transition-colors hover:bg-accent",
            )}
          >
            Talk to the team
          </Link>
        </div>
      </section>
    </div>
  )
}