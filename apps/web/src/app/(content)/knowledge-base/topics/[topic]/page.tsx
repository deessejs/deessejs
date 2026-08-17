import Link from "next/link"
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
import { Badge } from "@workspace/ui/components/badge"
import { H1, H2 } from "@workspace/ui/components/typography"
import { MdxRenderer } from "@/components/blog/mdx-renderer"
import { Prose } from "@/components/blog/prose"

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
        <H1>{topicDoc.title}</H1>
        <p className="text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          {topicDoc.description}
        </p>
        {topicDoc.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {topicDoc.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </header>

      <Prose className="mt-2">
        <MdxRenderer code={topicDoc.mdxCode} />
      </Prose>

      <section className="flex flex-col gap-4">
        <H2>Guides in this topic</H2>
        {topicGuides.length === 0 ? (
          <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
            No guides in this topic yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {topicGuides.map((guide) => (
              <li key={guide.slug}>
                <Link
                  href={`/knowledge-base/guides/${guide.slug}`}
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
    </div>
  )
}