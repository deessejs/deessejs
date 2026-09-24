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
import { MdxRenderer } from "@/components/blog/mdx-renderer"
import { TopicGuideList } from "@/components/knowledge-base/topic-guide-list"
import { TopicTagPill } from "@/components/knowledge-base/badges"
import { ORG_ID } from "@/lib/seo/organization"

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
    <section className="mx-auto max-w-4xl py-12 sm:py-16 lg:py-24">
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

      <header className="mt-6 flex flex-col gap-3">
        <h1 className="text-balance text-4xl font-bold tracking-tighter sm:text-5xl">
          {topicDoc.title}
        </h1>
        <p className="text-pretty text-base text-muted-foreground sm:text-lg">
          {topicDoc.description}
        </p>
        {topicDoc.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {topicDoc.tags.map((tag) => (
              <li key={tag}>
                <TopicTagPill>{tag}</TopicTagPill>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <MdxRenderer className="mt-8" code={topicDoc.mdxCode} />

      <section
        id="guides-in-this-topic"
        aria-labelledby="guides-in-this-topic-heading"
        className="mt-12 flex scroll-mt-20 flex-col gap-4"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="guides-in-this-topic-heading"
            className="text-3xl font-semibold tracking-tight"
          >
            Guides in this topic
          </h2>
          {topicGuides.length > 0 ? (
            <span className="text-copy-14 text-muted-foreground">
              {topicGuides.length}{" "}
              {topicGuides.length === 1 ? "guide" : "guides"}
            </span>
          ) : null}
        </div>
        {topicGuides.length === 0 ? (
          <p className="text-copy-14 text-muted-foreground leading-7">
            No guides in this topic yet.
          </p>
        ) : (
          <TopicGuideList guides={topicGuides} />
        )}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: topicDoc.title,
            description: topicDoc.description,
            inLanguage: "en",
            keywords: topicDoc.tags,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `/knowledge-base/topics/${topicDoc.slug}`,
            },
            url: `/knowledge-base/topics/${topicDoc.slug}`,
            publisher: { "@id": ORG_ID },
            author: {
              "@type": "Organization",
              name: "DeesseJS",
              "@id": ORG_ID,
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Knowledge Base",
                item: "/knowledge-base",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: topicDoc.title,
                item: `/knowledge-base/topics/${topicDoc.slug}`,
              },
            ],
          }),
        }}
      />
    </section>
  )
}