import Link from "next/link"
import { notFound } from "next/navigation"

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

type Params = { topic: string }

const TOPIC_DESCRIPTIONS: Record<string, string> = {
  "getting-started":
    "First-run setup, onboarding, and the common shortcuts new users hit.",
  agents:
    "Patterns for AI agents that code, review, and operate on your infra.",
  deployment:
    "From git push to production — environments, domains, env vars, observability.",
  databases:
    "Postgres, pgvector, migrations, schema design.",
  ui: "shadcn/ui, Tailwind, design tokens, themes.",
  cli: "deessejs CLI commands, registry, scaffolding.",
}

const TOPIC_GUIDES: Record<string, Array<{ slug: string; title: string }>> = {
  "getting-started": [
    { slug: "install-deessejs-cli", title: "Install the deessejs CLI" },
    { slug: "deploy-to-vercel", title: "Deploy to Vercel" },
  ],
  agents: [
    { slug: "first-agent-stack", title: "Build your first agent stack" },
    { slug: "nextjs-rag-template", title: "Use the Next.js RAG template" },
  ],
  deployment: [
    { slug: "deploy-to-vercel", title: "Deploy to Vercel" },
    { slug: "production-checklist", title: "Production readiness checklist" },
  ],
  databases: [
    { slug: "postgres-migrations", title: "Manage Postgres migrations" },
  ],
  ui: [{ slug: "shadcn-theming", title: "Theme with shadcn tokens" }],
  cli: [{ slug: "install-deessejs-cli", title: "Install the deessejs CLI" }],
}

const KNOWN_TOPICS = new Set(Object.keys(TOPIC_DESCRIPTIONS))

export default async function KnowledgeTopicPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { topic } = await params
  if (!KNOWN_TOPICS.has(topic)) {
    notFound()
  }
  const title = topic
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
  const description = TOPIC_DESCRIPTIONS[topic] ?? ""
  const guides = TOPIC_GUIDES[topic] ?? []

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-16 sm:px-6 lg:py-24">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/knowledge-base">
              Knowledge Base
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-3">
        <H1>{title}</H1>
        <p className="text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">{description}</p>
      </header>

      <section className="flex flex-col gap-4">
        <H2>Guides in this topic</H2>
        {guides.length === 0 ? (
          <p className="text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
            No guides in this topic yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {guides.map((guide) => (
              <li key={guide.slug}>
                <Link
                  href={`/knowledge-base/guide/${guide.slug}`}
                  className="flex items-center justify-between rounded-md border border-border px-4 py-3 transition-colors hover:bg-accent/30"
                >
                  <span className="text-label-16 text-foreground">
                    {guide.title}
                  </span>
                  <Badge variant="secondary">Guide</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card className="flex flex-col gap-3 p-6">
        <H2>About this topic</H2>
        <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          {description} More articles land here as the editorial
          pipeline ships.
        </p>
      </Card>
    </div>
  )
}