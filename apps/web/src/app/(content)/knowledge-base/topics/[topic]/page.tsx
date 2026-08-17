import { notFound } from "next/navigation"
import { allKbTopics, allKbGuides } from "content-collections"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { H2 } from "@workspace/ui/components/typography"
import { MdxRenderer } from "@/components/blog/mdx-renderer"
import { Prose } from "@/components/blog/prose"
import { GuideCard } from "@/components/knowledge-base/guide-card"
import { KbCardGrid } from "@/components/knowledge-base/kb-card-grid"
import { TopicTagPill } from "@/components/knowledge-base/badges"

type Params = { topic: string }

export function generateStaticParams(): Array<Params> {
  return allKbTopics.map((topic) => ({ topic: topic.slug }))
}

export default async function KnowledgeTopicPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { topic } = await params
  const topicDoc = allKbTopics.find((t) => t.slug === topic)
  if (!topicDoc) {
    notFound()
  }

  const topicGuides = allKbGuides
    .filter((g) => g.topic === topicDoc.slug)
    .sort((a, b) => a.order - b.order)

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
            <BreadcrumbPage>{topicDoc.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-3">
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight first:mt-0 text-balance">
          {topicDoc.title}
        </h1>
        <p className="text-muted-foreground leading-7 text-pretty [&:not(:first-child)]:mt-0">
          {topicDoc.description}
        </p>
        {topicDoc.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {topicDoc.tags.map((tag) => (
              <TopicTagPill key={tag}>{tag}</TopicTagPill>
            ))}
          </div>
        ) : null}
      </header>

      <Prose className="mt-2">
        <MdxRenderer code={topicDoc.mdxCode} />
      </Prose>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <H2>Guides in this topic</H2>
          {topicGuides.length > 0 ? (
            <span className="text-copy-14 text-muted-foreground">
              {topicGuides.length}{" "}
              {topicGuides.length === 1 ? "guide" : "guides"}
            </span>
          ) : null}
        </div>
        {topicGuides.length === 0 ? (
          <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
            No guides in this topic yet.
          </p>
        ) : (
          <KbCardGrid>
            {topicGuides.map((guide) => (
              <li key={guide.slug}>
                <GuideCard guide={guide} />
              </li>
            ))}
          </KbCardGrid>
        )}
      </section>
    </div>
  )
}