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

import { MdxRenderer } from "@/components/blog/mdx-renderer"
import { TableOfContents } from "@/components/blog/table-of-contents"
import { GuideCard } from "@/components/knowledge-base/guide-card"
import { KbCardGrid } from "@/components/knowledge-base/kb-card-grid"
import { GuideProductPill } from "@/components/knowledge-base/badges"
import { getRelatedGuides } from "@/lib/knowledge-base/guides"
import { ORG_ID } from "@/lib/seo/organization"
import { jsonLdScript } from "@/lib/json-ld"

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
      siteName: "DeesseJS",
      locale: "en_US",
      title: guide.title,
      description: guide.description,
      url: guide.url,
      tags: guide.products,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
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
  const topicTagSet = new Set(topic.tags)
  const offendingProduct = guide.products.find(
    (product) => !topicTagSet.has(product),
  )
  if (offendingProduct) {
    throw new Error(
      `Guide "${guide.slug}" declares product "${offendingProduct}" ` +
        `which is not on topic "${guide.topic}". Add it to the topic's ` +
        `tags, or remove it from the guide's products.`,
    )
  }

  const related = getRelatedGuides(slug, 2)

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <article className="mx-auto flex min-w-0 max-w-4xl flex-col gap-10 overflow-x-clip">
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
          <h1 className="text-balance text-4xl font-bold tracking-tighter sm:text-5xl">
            {guide.title}
          </h1>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            {guide.description}
          </p>
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_180px] lg:gap-12">
          <div className="min-w-0">
            <MdxRenderer id="guide-prose" className="mt-2" code={guide.mdxCode} />
          </div>
          <aside aria-label="Table of contents" className="hidden lg:block">
            <TableOfContents targetId="guide-prose" />
          </aside>
        </div>

        <section
          aria-labelledby="similar-guides-heading"
          className="flex flex-col gap-4"
        >
          <h2
            id="similar-guides-heading"
            className="text-balance text-3xl font-semibold tracking-tight first:mt-0"
          >
            Similar guides
          </h2>
          {related.length > 0 ? (
            <KbCardGrid className="md:grid-cols-2 lg:grid-cols-2">
              {related.map((relatedGuide) => (
                <li key={relatedGuide.slug}>
                  <GuideCard guide={relatedGuide} />
                </li>
              ))}
            </KbCardGrid>
          ) : (
            <p className="text-copy-14 text-muted-foreground leading-7">
              No similar guides in the {topic.title} topic yet.
            </p>
          )}
        </section>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: guide.title,
            description: guide.description,
            inLanguage: "en",
            keywords: guide.products,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": guide.url,
            },
            url: guide.url,
            publisher: { "@id": ORG_ID },
            author: {
              "@type": "Organization",
              name: "DeesseJS",
              "@id": ORG_ID,
            },
            // `about` ties the guide to its KB topic as the parent
            // definedTerm. Crawlers use this to build a topic graph
            // alongside the BreadcrumbList below.
            about: {
              "@type": "DefinedTerm",
              name: topic.title,
              url: `/knowledge-base/topics/${topic.slug}`,
            },
            // `dependencies` surfaces the PaaS/products the guide
            // touches. This is the JSON-LD counterpart of the
            // `GuideProductPill` badges in the header — the visual
            // representation alone is invisible to crawlers.
            ...(guide.products.length > 0
              ? {
                  dependencies: guide.products.map((product) => ({
                    "@type": "Service",
                    name: product,
                  })),
                }
              : {}),
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
                name: topic.title,
                item: `/knowledge-base/topics/${topic.slug}`,
              },
              {
                "@type": "ListItem",
                position: 4,
                name: guide.title,
                item: guide.url,
              },
            ],
          }),
        }}
      />
    </section>
  )
}