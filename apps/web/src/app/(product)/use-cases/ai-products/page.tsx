import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BarChart3, Database, FileText, GitBranch, Globe, Mail, MessageSquare, ShieldCheck, Zap } from "lucide-react"

import { clientEnv } from "@workspace/env/client"

import { UseCaseHero } from "../_components/use-case-page"
import { UseCaseStack } from "../_components/use-case-stack"
import { CopyCommand } from "../_components/copy-command"
import {
  AgentLoopMockup,
  ApiEndpointMockup,
  OtelWaterfallMockup,
  StreamingChatMockup,
} from "../_components/mockups"
import {
  AndMoreSection,
  type MoreTile,
  SimulatedSection,
} from "../_components/simulated-section"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

export const metadata: Metadata = {
  title: "AI products | DeesseJS",
  description:
    "RAG, chat, and agents wired against the same contracts your app uses.",
}

const STACK = [
  "Next.js",
  "AI SDK",
  "OpenAI",
  "pgvector",
  "Resend",
] as const

type Tool = {
  name: string
  description: string
  inputs: string
  outputs: string
  icon: React.ComponentType<{ className?: string }>
}

const TOOLS: ReadonlyArray<Tool> = [
  {
    name: "searchDocs",
    description: "Semantic search across your indexed docs and KB articles.",
    inputs: "query: string",
    outputs: "Array<{ id; snippet; score }>",
    icon: FileText,
  },
  {
    name: "fetchUser",
    description: "Look up a user record from Postgres with role check.",
    inputs: "userId: string",
    outputs: "User | null",
    icon: Database,
  },
  {
    name: "sendEmail",
    description: "Send a transactional email via Resend with a typed template.",
    inputs: "to: string; templateId: string; vars: Record<string, unknown>",
    outputs: "{ id: string }",
    icon: Mail,
  },
  {
    name: "scrapeUrl",
    description: "Fetch a URL and return a typed markdown extract.",
    inputs: "url: string; maxLength?: number",
    outputs: "{ title; markdown }",
    icon: Globe,
  },
  {
    name: "logEvent",
    description: "Append a typed event to the run trace.",
    inputs: "kind: EventKind; payload: unknown",
    outputs: "void",
    icon: GitBranch,
  },
  {
    name: "askFollowUp",
    description: "Pause and ask the user a clarifying question mid-run.",
    inputs: "question: string; choices: Array<{ label; value }>",
    outputs: "{ choice: string }",
    icon: MessageSquare,
  },
  {
    name: "getMetrics",
    description: "Pull a metric from observability for a given window.",
    inputs: "name: string; window: TimeWindow",
    outputs: "MetricSeries",
    icon: BarChart3,
  },
  {
    name: "checkPolicy",
    description: "Validate a candidate action against org-level policies.",
    inputs: "action: Action; context: unknown",
    outputs: "{ allowed: boolean; reason?: string }",
    icon: ShieldCheck,
  },
]

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

const AND_MORE: ReadonlyArray<MoreTile> = [
  { id: "auth",       title: "Auth",          description: "Better Auth + sessions",                 icon: Zap },
  { id: "database",   title: "Database",      description: "Postgres + pgvector",                    icon: Database },
  { id: "email",      title: "Email",         description: "Resend + React Email",                   icon: Mail },
  { id: "public-api", title: "Public API",    description: "Versioned, documented",                  icon: Globe },
  { id: "background", title: "Background",    description: "Queues + retries",                       icon: GitBranch },
]

export default function AiProductsPage() {
  // Resolve the apps/app signup URL server-side so the Final CTA link
  // is a fully-formed absolute URL by the time it reaches the browser.
  // Same convention as /pricing (apps/web/src/app/(marketing)/pricing/
  // page.tsx): env defaults to http://localhost:3001/signup in dev,
  // https://app.deessejs.com/signup in prod.
  const signupHref = new URL("/signup", clientEnv.NEXT_PUBLIC_APP_URL).toString()

  return (
    <div className="border border-border bg-background rounded-none">
        {/* 1. Hero — dark */}
        <UseCaseHero
          category="AI"
          title="Ship an agent that reads your contracts, not your docs."
          body="Tool calls typed against the same registry the UI uses. Every step is in the run trace."
          variant="dark"
          primaryCta={{
            label: "View ai-chatbot",
            href: "/templates/ai-chatbot",
          }}
          secondaryCta={{
            label: "Browse templates",
            href: "/templates",
          }}
        />

        {/* 2. Agent loop */}
        <SimulatedSection
          eyebrow="Agent loop"
          title="Plan, call, read, repeat."
          body="The agent plans a tool call, executes it against your typed contract, reads the result, and decides the next step. Every step is in the run trace."
          bullets={[
            "Plan and tool-call are explicit, not implicit",
            "Tool results are typed, not free-form",
            "Run trace persists every step for replay",
          ]}
          mockup={<AgentLoopMockup />}
          reverse
        />

        {/* 3. Streaming chat */}
        <SimulatedSection
          eyebrow="Streaming"
          title="Responses stream live, not as a blob."
          body="The user prompt lands, the agent responds token by token. The cursor blinks at the end of the stream until completion. No waiting for a 4-second silence."
          bullets={[
            "Server-sent events, no WebSocket plumbing",
            "Cancel mid-stream without orphaned tokens",
            "Token count surfaced in the footer",
          ]}
          mockup={<StreamingChatMockup />}
        />

        {/* 4. Tool registry — dark, unique to this page */}
        <div className="border-t border-zinc-800 bg-zinc-950 text-zinc-100">
          <div className="grid grid-cols-1 lg:grid-cols-6 lg:divide-x lg:divide-zinc-800">
            <div className="flex flex-col gap-3 p-6 lg:col-span-2 lg:p-10">
              <p className="text-label-13 uppercase tracking-wider text-zinc-400">
                Tool registry
              </p>
              <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-zinc-50 text-balance lg:text-heading-40">
                Eight typed tools out of the box.
              </h2>
              <p className="max-w-2xl text-copy-16 leading-7 text-zinc-400">
                Every tool is a typed function. The agent sees the schema, the
                runtime enforces it.
              </p>
            </div>
            <div className="grid grid-cols-1 divide-y divide-zinc-800 lg:col-span-4 !p-0 border-0 md:grid-cols-2 md:divide-x md:divide-y-0">
              {TOOLS.map((tool) => (
                <ToolCard key={tool.name} tool={tool} />
              ))}
            </div>
          </div>
        </div>

        {/* 5. Observable runs */}
        <SimulatedSection
          eyebrow="Observable"
          title="Every agent run is a trace."
          body="Tool calls, latency, errors land in the same waterfall your HTTP routes already use. The same observability contract - no second dashboard."
          bullets={[
            "OpenTelemetry waterfall, no extra setup",
            "Errors tagged with tool name and call site",
            "Replay any run from the trace ID",
          ]}
          mockup={<OtelWaterfallMockup />}
          reverse
        />

        {/* 6. The agent hits your API */}
        <SimulatedSection
          eyebrow="Contracts"
          title="The agent hits your typed API."
          body="Hono + oRPC procedures are typed end-to-end. The agent reads the schema the same way your runtime does - it cannot drift from the contract."
          bullets={[
            "Procedure types flow into the agent's tool manifest",
            "Auth and rate limits applied per procedure",
            "OpenAPI generated from the same router",
          ]}
          mockup={<ApiEndpointMockup />}
        />

        {/* 7. And more */}
        <AndMoreSection tiles={AND_MORE} />

        {/* 8. Stack */}
        <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
          <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Stack
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              Built on the AI primitives that ship in production.
            </h2>
          </div>
          <div className="lg:col-span-4 !p-0 border-0">
            <UseCaseStack items={[...STACK]} />
          </div>
        </div>

        {/* 9. Process */}
        <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
          <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Process
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              Three lines.
            </h2>
          </div>
          <div className="p-6 lg:col-span-4 lg:p-10">
            <ol className="flex flex-col gap-4">
              {[
                "Define your tools in TypeScript. The schema is the contract your agent calls.",
                "Wire the agent loop with the AI SDK. Tools, memory, and streaming come preconfigured.",
                "Ship. Every tool call is typed, traced, and persisted against the same contracts.",
              ].map((step, idx) => (
                <li key={step} className="flex gap-4">
                  <span className="w-8 shrink-0 font-mono text-copy-13 text-violet-600 dark:text-violet-400">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <p className="text-copy-16 leading-7 text-foreground">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* 10. CTA */}
        <div className="grid grid-cols-1 border-t border-border lg:grid-cols-2 lg:divide-x lg:divide-border">
          <div className="flex flex-col gap-4 p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Get started
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              Start from the tool registry, not from scratch.
            </h2>
            <CopyCommand command="deessejs init ai-chatbot" className="mt-2" />
            <p className="font-mono text-copy-13 text-muted-foreground">
              or run{" "}
              <span className="text-foreground/90">deessejs init --help</span> for
              the full list.
            </p>
          </div>
        </div>

        {/* 11. Related */}
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

        {/* 12. Final CTA — closing shared-border block (noBorderB) */}
        <FinalCta signupHref={signupHref} />
      </div>
  )
}

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon
  return (
    <div className="flex flex-col gap-3 border-t border-zinc-800 p-5 transition-colors hover:bg-zinc-900 first:border-t-0 lg:p-6">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md border border-violet-500/30 bg-violet-500/10">
          <Icon className="size-3.5 text-violet-400" aria-hidden />
        </span>
        <code className="font-mono text-copy-13 font-medium text-zinc-50">
          {tool.name}
        </code>
      </div>
      <p className="text-copy-13 leading-5 text-zinc-400">
        {tool.description}
      </p>
      <dl className="mt-auto flex flex-col gap-1 border-t border-violet-500/20 pt-2">
        <div className="flex gap-2 text-label-12">
          <dt className="w-12 shrink-0 text-zinc-500">in:</dt>
          <dd className="truncate font-mono text-zinc-300">{tool.inputs}</dd>
        </div>
        <div className="flex gap-2 text-label-12">
          <dt className="w-12 shrink-0 text-zinc-500">out:</dt>
          <dd className="truncate font-mono text-zinc-300">{tool.outputs}</dd>
        </div>
      </dl>
    </div>
  )
}
