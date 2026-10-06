import type { Metadata } from "next"
import { codeToHtml } from "shiki"
import Link from "next/link"
import {
  RelatedUseCases,
  type RelatedUseCaseItem,
} from "../_components/related-use-cases"

import { Section } from "@/components/marketing/section"
import { SectionHeader } from "@/components/marketing/section-header"
import { UseCaseHero } from "../_components/use-case-page"
import { TechStackGrid } from "@/components/marketing/tech-stack-grid"
import { UseCaseTabs } from "../_components/use-case-tabs"
import { AI_PRODUCTS_SNIPPETS, type AiProductsPillarSlug } from "../_components/ai-products-snippets"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

import { GROUP_1, GROUP_2 } from "./ai-products-tabs"

export const metadata: Metadata = {
  title: "AI products | DeesseJS",
  description:
    "RAG, chat, and agents wired against the same contracts your app uses.",
}

/**
 * Stack specific to the AI surface. Same shape as /saas-apps so
 * the brand display stays uniform with the rest of the marketing
 * surface, just with the AI-relevant technologies.
 */
const STACK = [
  { name: "Next.js",     logo: "vercel" },
  { name: "AI SDK",      logo: "openai" },
  { name: "OpenAI",      logo: "openai" },
  { name: "pgvector",    logo: "postgresql" },
  { name: "Drizzle",     logo: "drizzle" },
  { name: "Better Auth",  logo: "betterauth" },
  { name: "Cloudflare",  logo: "cloudflare" },
  { name: "Resend",      logo: "resend" },
] as const

const STEPS = [
  {
    heading: "Define the agent in TypeScript",
    body:
      "Tools, memory, and routing live in the same source as the rest of your app. The AI SDK reads them and wires the runtime.",
  },
  {
    heading: "Index what the agent should know",
    body:
      "Docs, KB articles, product data — pgvector indexes them in one query. No second database, no second dashboard.",
  },
  {
    heading: "Ship. Every tool call is on the trace.",
    body:
      "Tool calls stream into the same observability contract as your HTTP routes. Replay any run from the trace ID.",
  },
] as const

const RELATED = [
  {
    slug: "saas-apps",
    title: "SaaS apps",
    tagline:
      "Multi-tenant B2B SaaS with auth, billing, and a working dashboard on day one.",
  },
  {
    slug: "api-backends",
    title: "API backends",
    tagline:
      "Service-only backends with type-safe RPC and zero frontend overhead.",
  },
  {
    slug: "mobile-backend",
    title: "Mobile backend",
    tagline:
      "Auth, sync, and push notifications for native apps, on the same backend.",
  },
] as const satisfies ReadonlyArray<RelatedUseCaseItem>

/**
 * First-party templates the org has built on this surface. They
 * each ship on their own hosted URL once published — today they
 * remain pre-launch. The card grid signals production-ready
 * output without requiring links that don't resolve yet.
 */
const BUILT_TEMPLATES = [
  { slug: "agent-runtime", title: "agent-runtime", body: "Streaming chat and tool-call loop, against the AI SDK." },
  { slug: "kb-search",     title: "kb-search",     body: "pgvector-backed RAG over docs, KB articles, product schema." },
  { slug: "trace-replay",  title: "trace-replay",  body: "Replay any agent run from the OpenTelemetry trace ID." },
  { slug: "evals",         title: "evals",         body: "Score + rerank, with per-run cost and token budgets." },
] as const

/**
 * Four thematic clusters of capabilities an AI-product buyer reads
 * when they ask 'is this what I need to ship an agent?'. Same
 * shape as /saas-apps: each cluster leads with the question it
 * answers, then exposes 3 rows of selling copy. Plain prose, no
 * marketing fluff.
 */
export default async function AiProductsPage() {
  // Pre-render the eight ai-products pillar snippets server-side via
  // Shiki, identical to the homepage Ecosystem and /cli CliStart
  // pattern, and the saas-apps use case. Strings travel through the
  // Client Component boundary as plain HTML.
  const htmlBySlug: Record<string, { tabName: string; html: string }[]> = {
    "agent-loop": [], "typed-tools": [], "pgvector-search": [], "otel-trace": [],
    "streaming-cancel": [], "citation-prompt": [], "eval-scoring": [], "replay-console": [],
  }

  await Promise.all(
    (Object.keys(AI_PRODUCTS_SNIPPETS) as AiProductsPillarSlug[]).flatMap((slug) =>
      AI_PRODUCTS_SNIPPETS[slug].files.map((file) =>
        codeToHtml(file.code, {
          lang: file.lang,
          themes: { light: "github-light", dark: "github-dark" },
          defaultColor: false,
        }).then((html) => {
          htmlBySlug[slug]?.push({ tabName: file.tabName, html })
        }),
      ),
    ),
  )

  return (
    <div className="flex flex-col">
      {/* 1. Hero */}
      <UseCaseHero
        category="AI"
        title="Production agents, wired like the rest of your app."
        body="Streaming chat, typed tools, retrieval over your own data, and traces that survive the agent into the same observability dashboard. The four sub-systems an AI product needs are wired into the registry before your first commit."
        primaryCta={{
          label: "Use it yourself",
          href: "/templates",
        }}
        secondaryCta={{
          label: "Talk to delivery",
          href: "/delivery",
        }}
      />

      {/* 2. What's in the box — 4 tabs (customer surface).
           Same canonical Tabs + peek pattern as the saas-apps
           page; tabs LEFT, Shiki peek RIGHT. */}
      <Section>
        <SectionHeader
          eyebrow="What's in the box"
          title="The four sub-systems every AI product needs."
          subtitle="Eight capabilities grouped by the buyer-side question they answer. Two halves: what the agent does for the user, and what keeps it correct in production."
          bordered={true}
        />
        <UseCaseTabs pillars={GROUP_1} htmlBySlug={htmlBySlug} />
      </Section>

      {/* 3. Behind the curtain — 4 tabs (runtime), mirrored. */}
      <Section>
        <SectionHeader
          eyebrow="Behind the curtain"
          title="What keeps an agent in production."
          subtitle="The four sub-systems an on-call engineer names first. Same contracts, same registry, same auth, just on the other side of the same RPC."
          bordered={true}
        />
        <UseCaseTabs pillars={GROUP_2} htmlBySlug={htmlBySlug} reverse />
      </Section>

      {/* 3. Stack */}
      {/*    Same TechStackGrid + same Section shape as the saas-apps
           page (and the homepage + /pricing page). Header row on top,
           brand wall underneath. The brand tiles rotate on a swap
           animation, so the surface reads as a living tech stack
           rather than a static logo dump. */}
      <Section>
        <div className="flex flex-col divide-y divide-border">
          <div className="px-6 py-6 lg:px-10">
            <p className="text-heading-24 tracking-tighter text-balance [&:not(:first-child)]:mt-0">
              Built with the stack senior engineers ship on.
            </p>
          </div>
          <TechStackGrid techs={STACK} />
        </div>
      </Section>

      {/* 4. Process */}
      <div className="grid grid-cols-1 border-t border-border lg:grid-cols-12 lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-3 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Process
          </p>
          <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            How an AI product ships.
          </h2>
        </div>
        <ol className="grid grid-cols-1 divide-y divide-border lg:col-span-9 !p-0 border-0 md:grid-cols-3 md:divide-x md:divide-y-0">
          {STEPS.map((step, idx) => (
            <li
              key={step.heading}
              className="flex flex-col gap-3 p-6 lg:p-8"
            >
              <span className="font-mono text-copy-13 text-muted-foreground">
                Step {String(idx + 1).padStart(2, "0")}
              </span>
              <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
                {step.heading}
              </h3>
              <p className="text-copy-14 leading-6 text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* 5. Built on this */}
      {/*    Same 2-row layout as the other 4 migrated use-case
           pages: full-width header on top, then 4 cards on a
           single lg:grid-cols-4 row. Each card is fully clickable
           (entire <Link> wrapper) but uses href="#" since the
           template URLs are not yet deployed. Replace "#" with
           the live URL when each site ships. Each card carries a
           grey placeholder block at the top (no illustration, no
           label, no CTA below) so the section reads as 4 AI
           surfaces waiting to render. */}
      <section className="flex flex-col border-t border-border">
        <div className="flex flex-col gap-3 px-6 py-10 lg:px-10 lg:py-12 border-b border-border">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Built on this
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            Four templates, each on its own surface.
          </h2>
          <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Production-ready starter templates, each deployed at its own
            URL. Used as the reference set for what the registry can ship.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y divide-border sm:divide-y-0 sm:divide-x sm:divide-border">
          {BUILT_TEMPLATES.map((tpl) => (
            <Link
              key={tpl.slug}
              href="#"
              aria-label={`Visit ${tpl.slug}`}
              className="group flex flex-col transition-colors hover:bg-accent/40"
            >
              <div
                aria-hidden
                className="aspect-[16/10] w-full border-b border-border bg-muted/40 transition-colors group-hover:bg-muted/60"
              />
              <div className="flex flex-1 flex-col gap-2 p-6">
                <h3 className="font-mono text-copy-16 font-medium text-foreground">
                  {tpl.title}
                </h3>
                <p className="text-copy-14 leading-6 text-muted-foreground">
                  {tpl.body}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Related */}
      <RelatedUseCases items={RELATED} />

      <FinalCta />
    </div>
  )
}
