import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, FileText, Mail, Database, Globe, MessageSquare, BarChart3, ShieldCheck, GitBranch } from "lucide-react"

import { UseCaseHero } from "../_components/use-case-page"
import { UseCaseStack } from "../_components/use-case-stack"
import { CopyCommand } from "../_components/copy-command"
import { resolveCapabilities } from "../_data"

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

export default function AiProductsPage() {
  const capabilities = resolveCapabilities("ai-products")
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="flex flex-col gap-12">
        <UseCaseHero
          category="AI"
          title="Ship an agent that reads your contracts, not your docs."
          status="coming-soon"
          variant="dark"
          primaryCta={{
            label: "View ai-chatbot",
            href: "/templates/ai-chatbot",
          }}
          capabilities={capabilities}
        />

        {/* Tool registry — unique to this page */}
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100">
          <div className="flex flex-col gap-3 border-b border-zinc-800 p-6 lg:p-10">
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
          <div className="grid grid-cols-1 divide-y divide-zinc-800 md:grid-cols-2 md:divide-x md:divide-y-0">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </div>

        {/* Stack */}
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-3 border-b border-border p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Stack
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              Built on the AI primitives that ship in production.
            </h2>
          </div>
          <div className="!p-0 border-0">
            <UseCaseStack items={[...STACK]} />
          </div>
        </div>

        {/* Process */}
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-3 border-b border-border p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Process
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              Three lines.
            </h2>
          </div>
          <div className="p-6 lg:p-10">
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

        {/* CTA */}
        <div className="overflow-hidden rounded-lg border border-border">
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

        {/* Related */}
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-3 border-b border-border p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Explore
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              Related use cases.
            </h2>
          </div>
          <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
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
      </div>
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
