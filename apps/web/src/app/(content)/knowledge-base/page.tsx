import Link from "next/link"
import type { Metadata } from "next"
import { allKbGuides, allKbTopics } from "content-collections"

import { Card } from "@workspace/ui/components/card"
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { KbCardGrid } from "@/components/knowledge-base/kb-card-grid"
import { GuideList } from "@/components/knowledge-base/guide-list"
import { TopicTagPill, GuideProductPill } from "@/components/knowledge-base/badges"

export const metadata: Metadata = {
  title: "Knowledge Base",
  description:
    "In-depth guides, tutorials, and explainers for the DeesseJS ecosystem.",
  robots: { index: false, follow: false },
}

/**
 * Knowledge Base index at /knowledge-base.
 *
 * Wrapped in a single bordered card matching the homepage marketing
 * structure (Recipe A). Sections inside the card are separated by
 * `border-b border-border`. The last section has no trailing border.
 */

const TOPICS = [...allKbTopics].sort((a, b) => a.order - b.order)
const GUIDES = [...allKbGuides].sort((a, b) => a.order - b.order)
const FEATURED_GUIDES = GUIDES.slice(0, 6)

const ALL_PRODUCTS = Array.from(
  new Set(GUIDES.flatMap((guide) => guide.products)),
).sort()

function SectionHeading({
  eyebrow,
  title,
  aside,
}: {
  eyebrow: string
  title: string
  aside?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h2>
      </div>
      {aside ? (
        <div className="text-copy-14 text-muted-foreground">{aside}</div>
      ) : null}
    </header>
  )
}

function TopicCard({ topic }: { topic: (typeof TOPICS)[number] }) {
  return (
    <li>
      <Link
        href={`/knowledge-base/topics/${topic.slug}`}
        aria-label={`Browse the ${topic.title} topic`}
        className="group flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Card className="w-full flex-1 rounded-none border-0 bg-background transition-colors group-hover:bg-accent/30 group-focus-within:bg-accent/30">
          <CardHeader className="gap-3">
            <CardTitle className="text-label-16 font-semibold tracking-tight text-balance underline-offset-4 group-hover:underline">
              {topic.title}
            </CardTitle>
            <CardDescription className="text-copy-14 text-muted-foreground leading-7 text-pretty">
              {topic.description}
            </CardDescription>
          </CardHeader>
          {topic.tags.length > 0 ? (
            <CardContent className="flex flex-wrap gap-1.5">
              {topic.tags.slice(0, 3).map((tag) => (
                <TopicTagPill key={tag}>{tag}</TopicTagPill>
              ))}
            </CardContent>
          ) : null}
        </Card>
      </Link>
    </li>
  )
}

function GuideCardCompact({
  guide,
}: {
  guide: (typeof GUIDES)[number]
}) {
  return (
    <li>
      <Link
        href={`/knowledge-base/guides/${guide.slug}`}
        aria-label={`Read the ${guide.title} guide`}
        className="group flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Card className="w-full flex-1 rounded-none border-0 bg-background transition-colors group-hover:bg-accent/30 group-focus-within:bg-accent/30">
          <CardHeader className="gap-3">
            <CardTitle className="text-label-16 font-semibold tracking-tight text-balance underline-offset-4 group-hover:underline">
              {guide.title}
            </CardTitle>
            <CardDescription className="text-copy-14 text-muted-foreground leading-7 line-clamp-3 text-pretty">
              {guide.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {guide.products.slice(0, 3).map((product) => (
              <GuideProductPill key={product}>{product}</GuideProductPill>
            ))}
          </CardContent>
        </Card>
      </Link>
    </li>
  )
}

export default function KnowledgeBasePage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="border border-border bg-background rounded-none">
        <div className="border-b border-border px-6 py-10 sm:px-8 sm:py-14 lg:px-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Knowledge base
          </p>
          <h1 className="mt-2 text-balance text-4xl font-bold tracking-tighter sm:text-5xl">
            Knowledge Base
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
            In-depth guides, tutorials, and explainers for the
            DeesseJS ecosystem.
          </p>
        </div>

        <div className="border-b border-border px-6 py-10 sm:px-8 sm:py-14 lg:px-10">
          <div className="flex flex-col gap-6">
            <SectionHeading eyebrow="Topics" title="Topics" />
            <KbCardGrid>
              {TOPICS.map((topic) => (
                <TopicCard key={topic.slug} topic={topic} />
              ))}
            </KbCardGrid>
          </div>
        </div>

        <div className="border-b border-border px-6 py-10 sm:px-8 sm:py-14 lg:px-10">
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Featured"
              title="Featured Guides"
              aside={
                <Link
                  href="#all-guides"
                  className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  View all {GUIDES.length} guides →
                </Link>
              }
            />
            <KbCardGrid>
              {FEATURED_GUIDES.map((guide) => (
                <GuideCardCompact key={guide.slug} guide={guide} />
              ))}
            </KbCardGrid>
          </div>
        </div>

        <div id="all-guides" className="px-6 py-10 sm:px-8 sm:py-14 lg:px-10">
          <div className="flex flex-col gap-6">
            <SectionHeading eyebrow="Library" title="All Guides" />
            <GuideList
              guides={GUIDES.map((guide) => ({
                slug: guide.slug,
                title: guide.title,
                description: guide.description,
                url: guide.url,
                products: guide.products,
              }))}
              availableTags={ALL_PRODUCTS}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
