import { notFound } from "next/navigation"
import type { Metadata } from "next"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Badge } from "@workspace/ui/components/badge"
import { Card } from "@workspace/ui/components/card"
import { H1, H2 } from "@workspace/ui/components/typography"

type Params = { slug: string }

const KNOWN_SLUGS = new Set([
  "install-deessejs-cli",
  "first-agent-stack",
  "deploy-to-vercel",
  "nextjs-rag-template",
  "background-jobs-queue",
  "observability-logging",
  "postgres-migrations",
  "shadcn-theming",
  "production-checklist",
])

const GUIDE_META: Record<
  string,
  { title: string; description: string; products: string[] }
> = {
  "install-deessejs-cli": {
    title: "Install the deessejs CLI",
    description:
      "Set up the CLI, authenticate, and discover templates from the registry.",
    products: ["cli", "registry"],
  },
  "first-agent-stack": {
    title: "Build your first agent stack",
    description:
      "Compose an AI agent with the SDK, a tool registry, and a streaming endpoint.",
    products: ["agents", "ai-sdk"],
  },
  "deploy-to-vercel": {
    title: "Deploy to Vercel",
    description:
      "Connect your repo, configure environments, and run your first production build.",
    products: ["deploy"],
  },
  "nextjs-rag-template": {
    title: "Use the Next.js RAG template",
    description:
      "From the templates registry to a streaming chat endpoint with embeddings.",
    products: ["templates", "ai", "postgres"],
  },
  "background-jobs-queue": {
    title: "Run background jobs",
    description:
      "Queue and worker patterns for async work outside your request path.",
    products: ["queue"],
  },
  "observability-logging": {
    title: "Add observability",
    description:
      "Logs, traces, and metrics — the three signals that catch production issues.",
    products: ["observability"],
  },
  "postgres-migrations": {
    title: "Manage Postgres migrations",
    description: "Drizzle migrations in CI, rollback, zero-downtime.",
    products: ["database"],
  },
  "shadcn-theming": {
    title: "Theme with shadcn tokens",
    description: "Add semantic tokens, dark mode, brand colors.",
    products: ["ui"],
  },
  "production-checklist": {
    title: "Production readiness checklist",
    description:
      "Auth, secrets, observability, rate limits — what to verify.",
    products: ["deploy"],
  },
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> => {
  const { slug } = await params
  const meta = GUIDE_META[slug]
  if (!meta) return { title: "Guide not found" }
  return { title: meta.title, description: meta.description }
}

export default async function KnowledgeGuidePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  if (!KNOWN_SLUGS.has(slug)) {
    notFound()
  }
  const meta = GUIDE_META[slug]
  if (!meta) notFound()

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-16 sm:px-6 lg:py-24">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/knowledge-base">
              Knowledge Base
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{meta.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {meta.products.map((product) => (
            <Badge key={product} variant="secondary">
              {product}
            </Badge>
          ))}
        </div>
        <H1>{meta.title}</H1>
        <p className="text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">{meta.description}</p>
      </header>

      <section className="flex flex-col gap-4">
        <H2>Overview</H2>
        <Card className="p-6">
          <p className="text-copy-16 text-foreground leading-7 [&:not(:first-child)]:mt-0">{meta.description}</p>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <H2>Steps</H2>
        <ol className="flex flex-col gap-3 text-copy-16">
          <li>
            <span className="text-label-14 text-muted-foreground mr-2">
              1.
            </span>
            Install the prerequisites and authenticate the CLI.
          </li>
          <li>
            <span className="text-label-14 text-muted-foreground mr-2">
              2.
            </span>
            Run the relevant command for this guide.
          </li>
          <li>
            <span className="text-label-14 text-muted-foreground mr-2">
              3.
            </span>
            Verify the result locally, then promote to production.
          </li>
        </ol>
      </section>

      <Card className="flex flex-col gap-3 p-6">
        <H2>Need help?</H2>
        <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          This guide is a placeholder. The full step-by-step
          lands when the editorial pipeline ships.
        </p>
      </Card>
    </article>
  )
}