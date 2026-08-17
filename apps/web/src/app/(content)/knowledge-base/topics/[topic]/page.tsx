import { notFound } from "next/navigation"
import { allKbTopics } from "content-collections"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Card } from "@workspace/ui/components/card"
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
      </header>

      <Prose className="mt-2">
        <MdxRenderer code={topicDoc.mdxCode} />
      </Prose>

      <section className="flex flex-col gap-4">
        <H2>Guides in this topic</H2>
        <Card className="flex flex-col gap-3 p-6">
          <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
            Guides for this topic land when the guides ADR is
            implemented. The topic body above is editorial
            content; the guide list lives in a separate
            collection.
          </p>
        </Card>
      </section>
    </div>
  )
}