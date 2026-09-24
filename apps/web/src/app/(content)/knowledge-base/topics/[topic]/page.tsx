import * as React from "react"
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
import { GuideCard } from "@/components/knowledge-base/guide-card"
import { KbCardGrid } from "@/components/knowledge-base/kb-card-grid"
import { TopicTagPill } from "@/components/knowledge-base/badges"
import { ORG_ID } from "@/lib/seo/organization"
import { jsonLdScript } from "@/lib/json-ld"

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
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
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
          __html: jsonLdScript({
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
        <h1 className="text-balance text-4xl font-bold tracking-tighter sm:text-5xl">
          {topicDoc.title}
        </h1>
        <p className="mt-4 text-pretty text-lg text-muted-foreground">
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

      <MdxRenderer className="mt-2" code={topicDoc.mdxCode} />

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
                <GuideCard
                  guide={
                    {
                      ...guide,
                      date: guide.date,
                      readingTime: guide.readingTime ?? 0,
                    } as React.ComponentProps<typeof GuideCard>["guide"]
                  }
                />
              </li>
            ))}
          </KbCardGrid>
        )}
      </section>
    </section>
  )
}