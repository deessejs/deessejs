import Link from "next/link"
import type { Metadata } from "next"
import { allKbTopics, allKbGuides } from "content-collections"

import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { H1, H2 } from "@workspace/ui/components/typography"

import { KbCardGrid } from "@/components/knowledge-base/kb-card-grid"
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
 * Vercel-style surface (https://vercel.com/knowledge):
 *
 *   1. Hero — title + tagline
 *   2. Featured Topics — 3 tiles
 *   3. Featured Guides — 6 cards
 *   4. Topic Tags — cloud derived from all topic tags
 *   5. All Topics — full grid
 *   6. All Guides — list
 *   7. CTA strip
 *
 * Topic and guide sections read from their respective
 * content-collections (ADR-013, ADR-014). Cards use the
 * templates-grid pattern (bg-background, no rounded, divide
 * borders) for a continuous table-like surface.
 */

const TOPICS = [...allKbTopics].sort((a, b) => a.order - b.order)
const FEATURED_TOPICS = TOPICS.slice(0, 3)

const GUIDES = [...allKbGuides].sort((a, b) => a.order - b.order)
const FEATURED_GUIDES = GUIDES.slice(0, 6)

const ALL_TOPICS = TOPICS
const ALL_GUIDES = GUIDES

export default function KnowledgeBasePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:gap-24 lg:py-24">
      {/* Hero */}
      <header className="flex flex-col items-center gap-6 text-center">
        <H1>Knowledge Base</H1>
        <p className="max-w-2xl text-muted-foreground text-copy-18 leading-7 [&:not(:first-child)]:mt-0">
          In-depth guides, tutorials, and explainers for the
          DeesseJS ecosystem.
        </p>
      </header>

      {/* Featured Topics */}
      <section className="flex flex-col gap-6">
        <H2>Featured Topics</H2>
        <KbCardGrid>
          {FEATURED_TOPICS.map((topic) => (
            <li key={topic.slug}>
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
          ))}
        </KbCardGrid>
      </section>

      {/* Featured Guides */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <H2>Featured Guides</H2>
          <Link
            href="#all-guides"
            className="text-copy-14 text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            View all {ALL_GUIDES.length} guides →
          </Link>
        </div>
        <KbCardGrid>
          {FEATURED_GUIDES.map((guide) => (
            <li key={guide.slug}>
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
          ))}
        </KbCardGrid>
      </section>

      {/* All Topics */}
      <section className="flex flex-col gap-6">
        <H2>All Topics</H2>
        <KbCardGrid>
          {ALL_TOPICS.map((topic) => (
            <li key={topic.slug}>
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
          ))}
        </KbCardGrid>
      </section>

      {/* All Guides */}
      <section id="all-guides" className="flex flex-col gap-6">
        <H2>All Guides</H2>
        <ul className="m-0 flex flex-col list-none divide-y divide-border p-0">
          {ALL_GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/knowledge-base/guides/${guide.slug}`}
                aria-label={`Read the ${guide.title} guide`}
                className="group flex flex-col gap-1 px-2 py-4 transition-colors hover:bg-accent/30 focus-visible:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="text-label-16 font-medium text-foreground underline-offset-4 group-hover:underline text-balance">
                  {guide.title}
                </span>
                <span className="text-copy-13 text-muted-foreground text-pretty">
                  {guide.description}
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {guide.products.slice(0, 3).map((product) => (
                    <GuideProductPill key={product}>
                      {product}
                    </GuideProductPill>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="mt-16 flex flex-col items-center gap-3 text-center sm:mt-24">
        <H2>Ready to ship?</H2>
        <p className="text-muted-foreground max-w-xl text-copy-16 leading-7 [&:not(:first-child)]:mt-0">
          Spin up your first project from a DeesseJS template in
          under a minute.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/templates">Start with a template</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/enterprise">Talk to the team</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}