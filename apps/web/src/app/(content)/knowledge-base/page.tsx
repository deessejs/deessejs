import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Clock } from "lucide-react"
import { allKbGuides, allKbTopics } from "content-collections"

import { Card } from "@workspace/ui/components/card"
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { FlickeringGrid } from "@/app/(marketing)/_components/flickering-grid"
import { KbCardGrid } from "@/components/knowledge-base/kb-card-grid"
import { GuideList } from "@/components/knowledge-base/guide-list"
import { TopicTagPill, GuideProductPill } from "@/components/knowledge-base/badges"
import { AuthorAvatarLink } from "@/components/blog/author-avatar"

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

// Count guides per topic so the topic card can show "N guides".
const GUIDES_PER_TOPIC = new Map<string, number>()
for (const guide of GUIDES) {
  GUIDES_PER_TOPIC.set(
    guide.topic,
    (GUIDES_PER_TOPIC.get(guide.topic) ?? 0) + 1,
  )
}

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
    <header className="flex flex-col gap-2 p-4 sm:flex-row sm:items-end sm:justify-between">
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

function TopicCard({
  topic,
  guidesCount,
}: {
  topic: (typeof TOPICS)[number]
  guidesCount: number
}) {
  return (
    <li className="h-full">
      <Link
        href={`/knowledge-base/topics/${topic.slug}`}
        aria-label={`Browse the ${topic.title} topic`}
        className="group flex h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Card className="flex w-full flex-1 flex-col rounded-none border-0 bg-background ring-0 transition-colors group-hover:bg-accent/30 group-focus-within:bg-accent/30">
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
          <div className="mt-auto flex items-center justify-between px-6 pb-6 text-xs text-muted-foreground">
            <span>
              {guidesCount} {guidesCount === 1 ? "guide" : "guides"}
            </span>
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1 text-foreground" />
          </div>
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
    <li className="h-full">
      <Link
        href={`/knowledge-base/guides/${guide.slug}`}
        aria-label={`Read the ${guide.title} guide`}
        className="group flex h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Card className="flex w-full flex-1 flex-col rounded-none border-0 bg-background ring-0 transition-colors group-hover:bg-accent/30 group-focus-within:bg-accent/30">
          <CardHeader className="gap-3">
            <div className="flex items-start justify-between gap-3">
              {guide.date ? (
                <div className="relative z-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <time dateTime={guide.date}>{guide.date}</time>
                </div>
              ) : (
                <div />
              )}
              {guide.products.length > 0 ? (
                <div className="relative z-10 flex flex-wrap justify-end gap-1.5">
                  {guide.products.slice(0, 3).map((product) => (
                    <GuideProductPill key={product}>
                      {product}
                    </GuideProductPill>
                  ))}
                </div>
              ) : null}
            </div>
            <CardTitle className="mt-1 text-balance text-xl tracking-tight">
              {guide.title}
            </CardTitle>
            <CardDescription className="mt-2 line-clamp-3 text-sm text-muted-foreground">
              {guide.description}
            </CardDescription>
          </CardHeader>
          <div className="mt-auto px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="relative z-10 flex flex-wrap items-center gap-x-3 gap-y-1">
                {guide.author ? (
                  <span className="inline-flex items-center gap-2">
                    <AuthorAvatarLink author={guide.author} size={20} />
                    <span className="text-xs text-foreground">
                      {guide.author.name}
                    </span>
                    {guide.author.role ? (
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {guide.author.role}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </div>
              {guide.readingTime ? (
                <div className="flex flex-wrap items-center justify-end gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    {guide.readingTime} min read
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </Card>
      </Link>
    </li>
  )
}

export default function KnowledgeBasePage() {
  return (
    <section>
      <div className="border border-border bg-background rounded-none">
        <header className="relative overflow-hidden border-b border-border">
          <FlickeringGrid
            className="absolute inset-0 z-0 opacity-60"
            squareSize={3}
            gridGap={5}
            flickerChance={0.15}
            maxOpacity={0.18}
            color="rgb(120, 120, 120)"
          />
          <div className="relative z-10 flex flex-col items-center gap-3 px-6 py-16 text-center sm:py-20 lg:py-24">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Knowledge base
            </p>
            <h1 className="text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56">
              Knowledge Base
            </h1>
            <p className="max-w-2xl text-copy-18 leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
              In-depth guides, tutorials, and explainers for the
              DeesseJS ecosystem.
            </p>
          </div>
        </header>

        <div className="border-b border-border">
          <div className="flex flex-col divide-y border-border">
            <SectionHeading
              eyebrow="Featured"
              title="Featured Guides"
            />
            <KbCardGrid>
              {FEATURED_GUIDES.map((guide) => (
                <GuideCardCompact key={guide.slug} guide={guide} />
              ))}
            </KbCardGrid>
          </div>
        </div>

        <div id="all-guides" className="border-b border-border py-10 sm:py-2">
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

        <div className="py-10 sm:py-2">
          <div className="flex flex-col">
            <SectionHeading eyebrow="Topics" title="Topics" />
            <KbCardGrid>
              {TOPICS.map((topic) => (
                <TopicCard
                  key={topic.slug}
                  topic={topic}
                  guidesCount={GUIDES_PER_TOPIC.get(topic.slug) ?? 0}
                />
              ))}
            </KbCardGrid>
          </div>
        </div>
      </div>
    </section>
  )
}
