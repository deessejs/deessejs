import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { allKbGuides, allKbTopics } from "content-collections"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { H2 } from "@workspace/ui/components/typography"
import { Separator } from "@workspace/ui/components/separator"

import { MdxRenderer } from "@/components/blog/mdx-renderer"
import { Prose } from "@/components/blog/prose"
import { TableOfContents } from "@/components/blog/table-of-contents"
import { GuideCard } from "@/components/knowledge-base/guide-card"
import { KbCardGrid } from "@/components/knowledge-base/kb-card-grid"
import { GuideProductPill } from "@/components/knowledge-base/badges"
import { getRelatedGuides } from "@/lib/knowledge-base/guides"

type Params = { slug: string }

/**
 * Per-topic CTA copy. Inline for v1 — promoting `cta` to a
 * topic frontmatter field is a future ADR if editorial wants
 * per-topic copy. The fallback below covers any topic that
 * isn't listed.
 */
const TOPIC_CTAS: Record<
  string,
  { heading: string; body: string }
> = {
  "getting-started": {
    heading: "Ship your first project",
    body: "Bootstrap a working preview in under ten minutes. The CLI scaffolds, the templates fill the gaps, and the docs walk you through the rest.",
  },
  agents: {
    heading: "Compose your first agent",
    body: "Wire a model, a tool registry, and a streaming endpoint. The agent stack ships ready; you bring the prompt.",
  },
  deployment: {
    heading: "Promote to production",
    body: "Connect the repo, configure environments, run the production-readiness checklist, and ship.",
  },
  databases: {
    heading: "Wire your first migration",
    body: "Drizzle generates the SQL; CI applies it; the rollback runbook is on standby.",
  },
  ui: {
    heading: "Reskin for your brand",
    body: "Pick a starting palette, override the semantic tokens, and the rest of the app inherits the change.",
  },
  cli: {
    heading: "Install the CLI",
    body: "One install, one login, one list command. The registry is the entry point to every template.",
  },
  queue: {
    heading: "Move async work off the request path",
    body: "Enqueue, run the worker, retry on failure. The queue substrate is already wired.",
  },
  observability: {
    heading: "Capture the three signals",
    body: "Logs, traces, and metrics. The baseline setup is a one-file install.",
  },
}

export function generateStaticParams(): Array<Params> {
  return allKbGuides.map((guide) => ({ slug: guide.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const guide = allKbGuides.find((g) => g.slug === slug)
  if (!guide) return { title: "Guide not found" }
  const topic = allKbTopics.find((t) => t.slug === guide.topic)
  return {
    title: `${guide.title} — ${topic?.title ?? "Knowledge Base"}`,
    description: guide.description,
    alternates: { canonical: guide.url },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: guide.url,
    },
  }
}

export default async function KnowledgeGuidePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const guide = allKbGuides.find((g) => g.slug === slug)
  if (!guide) notFound()

  const topic = allKbTopics.find((t) => t.slug === guide.topic)
  if (!topic) {
    throw new Error(
      `Guide "${guide.slug}" references unknown topic "${guide.topic}". ` +
        `Add content/knowledge-base/topics/${guide.topic}.mdx or fix ` +
        `the guide's topic field.`,
    )
  }

  // Products ↔ topic tags alignment (ADR-014). A guide whose
  // `products` value is not on its topic's `tags` is a build error.
  const offendingProduct = guide.products.find(
    (product) => !topic.tags.includes(product),
  )
  if (offendingProduct) {
    throw new Error(
      `Guide "${guide.slug}" declares product "${offendingProduct}" ` +
        `which is not on topic "${guide.topic}". Add it to the topic's ` +
        `tags, or remove it from the guide's products.`,
    )
  }

  const related = getRelatedGuides(slug, 3)
  const cta = TOPIC_CTAS[topic.slug] ?? {
    heading: `Explore the ${topic.title} guides`,
    body: `Browse every guide in the ${topic.title} topic.`,
  }

  return (
    <article className="mx-auto flex min-w-0 max-w-4xl flex-col gap-10 overflow-x-clip px-4 py-16 sm:px-6 lg:py-24">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/knowledge-base">
              Knowledge Base
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/knowledge-base/topics/${topic.slug}`}>
              {topic.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{guide.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {guide.products.map((product) => (
            <GuideProductPill key={product}>{product}</GuideProductPill>
          ))}
        </div>
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight first:mt-0 text-balance">
          {guide.title}
        </h1>
        <p className="text-muted-foreground leading-7 text-pretty [&:not(:first-child)]:mt-0">
          {guide.description}
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_180px] lg:gap-12">
        <div className="min-w-0">
          <Prose id="guide-prose" className="mt-2">
            <MdxRenderer code={guide.mdxCode} />
          </Prose>
        </div>
        <aside className="hidden lg:block">
          <TableOfContents targetId="guide-prose" />
        </aside>
      </div>

      <Separator className="my-12" />

      <Card className="flex flex-col gap-4 p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-label-13 uppercase tracking-widest text-muted-foreground">
            Next steps in {topic.title}
          </span>
          <h2 className="text-balance text-2xl font-semibold tracking-tight">
            {cta.heading}
          </h2>
          <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
            {cta.body}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/knowledge-base/topics/${topic.slug}`}>
              Browse all {topic.title} guides
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/templates">Start with a template</Link>
          </Button>
        </div>
      </Card>

      {related.length > 0 ? (
        <section className="flex flex-col gap-4">
          <H2>Similar guides</H2>
          <KbCardGrid>
            {related.map((relatedGuide) => (
              <li key={relatedGuide.slug}>
                <GuideCard guide={relatedGuide} />
              </li>
            ))}
          </KbCardGrid>
        </section>
      ) : null}
    </article>
  )
}