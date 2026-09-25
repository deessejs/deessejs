import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { UseCaseHero } from "../_components/use-case-page"
import { TechStackGrid } from "@/app/(marketing)/_components/tech-stack-grid"
import { CapabilityClustersSection } from "../_components/capability-cluster"
import {
  AgentLoopMockup,
  ApiEndpointMockup,
  KnowledgeRetrievalMockup,
  OtelWaterfallMockup,
} from "../_components/mockups"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

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
  { name: "Next.js",   logo: "vercel" },
  { name: "AI SDK",    logo: "openai" },
  { name: "OpenAI",    logo: "openai" },
  { name: "pgvector",  logo: "postgresql" },
  { name: "Resend",    logo: "resend" },
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
] as const

/**
 * Four thematic clusters of capabilities an AI-product buyer reads
 * when they ask 'is this what I need to ship an agent?'. Same
 * shape as /saas-apps: each cluster leads with the question it
 * answers, then exposes 3 rows of selling copy. Plain prose, no
 * marketing fluff.
 */
const CAPABILITY_CLUSTERS = [
  {
    id: "conversational-agent",
    iconName: "MessageSquare",
    title: "Conversational agent",
    lead:
      "The user-facing surface. How the agent talks to the user, and stays coherent past the first reply.",
    rows: [
      {
        id: "streaming",
        title: "Streaming responses",
        body:
          "Tokens stream token by token over server-sent events, no WebSocket plumbing, no 4-second silence before the first character. The cursor sits at the end of the stream until completion, and the user can cancel mid-stream without orphaned tokens.",
      },
      {
        id: "memory",
        title: "Conversation memory",
        body:
          "Conversation state persists across turns and sessions. The agent reads prior messages before each step, so 'what was that variable again?' works without rebuilding the prompt inline. Memory writes go through the same observability contract as the rest of the app.",
      },
      {
        id: "follow-ups",
        title: "Pausing for clarification",
        body:
          "When the model needs more input, the agent pauses the run and asks the user a typed choice. No 'context has gone, please re-enter' surprises — the run resumes with the new input appended.",
      },
    ],
  },
  {
    id: "tool-integration",
    iconName: "Wrench",
    title: "Tool integration",
    lead:
      "Where the agent stops being a chat and becomes useful — the contract surface where it touches the rest of your app.",
    rows: [
      {
        id: "tool-schema",
        title: "Typed tool schema",
        body:
          "Tools are TypeScript functions; the schema is the contract your agent calls. Inputs and outputs are typed against the same registry your UI reads, so a tool that compiles in your app compiles for the agent.",
      },
      {
        id: "hono-orpc",
        title: "Hono + oRPC bridges",
        body:
          "Procedure types from your existing oRPC router flow into the agent's tool manifest. The agent consumes the contract, not the implementation — no drift between what your UI does and what the agent does.",
      },
      {
        id: "auth-rate-limit",
        title: "Auth + rate limits, applied",
        body:
          "Auth and rate limits follow the same rules when the agent calls as when a user does. Every tool call carries the org context, so a customer-scoped tool only reads that customer's data.",
      },
    ],
  },
  {
    id: "knowledge-retrieval",
    iconName: "Database",
    title: "Knowledge retrieval",
    lead:
      "How the agent grounds itself in your domain — without re-training, without a second database.",
    rows: [
      {
        id: "pgvector",
        title: "pgvector, indexed at write time",
        body:
          "Postgres + pgvector is the index. The same Drizzle schema your app reads, the same pgvector index the agent queries. No second database to provision, no second backup to schedule, no second connection pool to monitor.",
      },
      {
        id: "reranking",
        title: "Score + rerank",
        body:
          "Search returns scored chunks the agent reads in order. Top results carry enough context for grounding; the agent cites the chunk IDs in its reply so the user can audit what fed the answer.",
      },
      {
        id: "documents",
        title: "Documents and KB articles",
        body:
          "The same ingestion pipeline handles docs, KB articles, and product schema — anything with a version and a slug. Old versions are pruned automatically so the agent never answers from stale context.",
      },
    ],
  },
  {
    id: "production-operations",
    iconName: "Activity",
    title: "Production operations",
    lead:
      "How the agent stays correct, fast, and observable the day a customer files a support ticket about a wrong answer.",
    rows: [
      {
        id: "run-trace",
        title: "Run traces",
        body:
          "Tool calls, latency, errors, and token counts land in the same waterfall your HTTP routes already use. One OpenTelemetry pipeline. Errors tagged with tool name and call site so a 500 in production has a runtime.",
      },
      {
        id: "replay",
        title: "Replay from a trace ID",
        body:
          "Every run has a trace ID you can replay from the operator console. Re-run with the same inputs, compare outputs, ship a fix without ever touching production traffic.",
      },
      {
        id: "cost",
        title: "Token + cost budgets",
        body:
          "Per-run, per-user, per-org. Hard limits surface in the dashboard before the bill does. No month-end surprise when the agent hit an unbounded loop over the weekend.",
      },
    ],
  },
] as const

/**
 * Mockup map keyed by cluster.id. One real mockup per cluster.
 * Pre-existing tree mockups retained for the surfaces they cover:
 *   - AgentLoopMockup        → Conversational agent
 *   - ApiEndpointMockup      → Tool integration
 *   - KnowledgeRetrievalMockup → Knowledge retrieval (first version)
 *   - OtelWaterfallMockup    → Production operations
 */
const CLUSTER_MOCKUPS = {
  "conversational-agent": <AgentLoopMockup />,
  "tool-integration":      <ApiEndpointMockup />,
  "knowledge-retrieval":   <KnowledgeRetrievalMockup />,
  "production-operations": <OtelWaterfallMockup />,
} as const

export default function AiProductsPage() {
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

      {/* 2. What's in the box — four capability clusters */}
      <section className="border-b border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-10 lg:px-10 lg:py-12">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            What&apos;s in the box
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            The four sub-systems every AI product needs.
          </h2>
          <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Eleven capabilities grouped by the buyer-side question
            they answer. Pick a cluster, read what you actually get,
            and ship it.
          </p>
        </div>
        <CapabilityClustersSection
          clusters={CAPABILITY_CLUSTERS}
          mockups={CLUSTER_MOCKUPS}
        />
      </section>

      {/* 3. Stack */}
      <section className="flex flex-col border-t border-border">
        <div className="flex flex-col gap-3 px-6 py-10 lg:px-10 lg:py-12 border-b border-border">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Stack
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            What runs on day one.
          </h2>
        </div>
        <TechStackGrid techs={STACK} />
      </section>

      {/* 4. Process */}
      <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Process
          </p>
          <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            How an AI product ships.
          </h2>
        </div>
        <ol className="grid grid-cols-1 divide-y divide-border lg:col-span-4 !p-0 border-0 md:grid-cols-3 md:divide-x md:divide-y-0">
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

      {/* 5. Related */}
      <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Explore
          </p>
          <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            Related use cases.
          </h2>
        </div>
        <div className="grid grid-cols-1 divide-y divide-border lg:col-span-4 !p-0 border-0 md:grid-cols-3 md:divide-x md:divide-y-0">
          {RELATED.map((item) => (
            <Link
              key={item.slug}
              href={`/use-cases/${item.slug}`}
              className="group flex flex-col gap-2 p-6 transition-colors hover:bg-accent/40 lg:p-8"
            >
              <p className="text-label-13 text-muted-foreground">Related</p>
              <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="line-clamp-3 text-copy-14 leading-6 text-muted-foreground">
                {item.tagline}
              </p>
              <p className="inline-flex items-center gap-1 pt-1 text-label-13 text-foreground">
                Read more
                <ArrowRight
                  className="size-3 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </p>
            </Link>
          ))}
        </div>
      </div>

      <FinalCta />
    </div>
  )
}
