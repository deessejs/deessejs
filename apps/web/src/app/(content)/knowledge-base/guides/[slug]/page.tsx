import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { allKbGuides, allKbTopics } from "content-collections"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Badge } from "@workspace/ui/components/badge"
import { H1 } from "@workspace/ui/components/typography"

import { MdxRenderer } from "@/components/blog/mdx-renderer"
import { Prose } from "@/components/blog/prose"

type Params = { slug: string }

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
  // The check is at module top-level so it runs at build time
  // (not per-request).
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
        <div className="flex flex-wrap items-center gap-2">
          {guide.products.map((product) => (
            <Badge key={product} variant="secondary">
              {product}
            </Badge>
          ))}
        </div>
        <H1>{guide.title}</H1>
        <p className="text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          {guide.description}
        </p>
      </header>

      <Prose className="mt-2">
        <MdxRenderer code={guide.mdxCode} />
      </Prose>
    </article>
  )
}