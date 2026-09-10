import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, FileText, Mail, Database, Globe, MessageSquare, BarChart3, ShieldCheck, GitBranch } from "lucide-react"

import { UseCaseHero } from "../_components/use-case-page"
import { UseCaseStack } from "../_components/use-case-stack"
import { CopyCommand } from "../_components/copy-command"

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

const STEPS = [
  "Define your tools in TypeScript. The schema is the contract your agent calls.",
  "Wire the agent loop with the AI SDK. Tools, memory, and streaming come preconfigured.",
  "Ship. Every tool call is typed, traced, and persisted against the same contracts.",
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
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="border border-border bg-background rounded-none">
        {/* 1. Hero — dark, full-width code-centric */}
        <UseCaseHero
          category="AI"
          title="Ship an agent that reads your contracts, not your docs."
          tagline="RAG, chat, and agents wired against the same contracts your app uses. Tools are typed functions. Every call is traced. The plumbing is not the product."
          variant="dark"
          status="coming-soon"
          primaryCta={{
            label: "View ai-chatbot",
            href: "/templates/ai-chatbot",
          }}
          secondaryCta={{
            label: "Talk to delivery",
            href: "/contact",
          }}
        />

        {/* 2. Tool registry — unique to this page */}
        <div className="border-b border-border">
          <div className="grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
            <div className="lg:col-span-2 flex flex-col gap-3 justify-center p-6 lg:p-10 bg-violet-500/5">
              <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
                Tool registry
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
                Eight typed tools out of the box.
              </h2>
              <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                Every tool is a typed function. The agent sees the schema, the
                runtime enforces it.
              </p>
            </div>
            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 divide-y divide-border md:divide-y-0 md:divide-x divide-border bg-violet-500/5 !p-0 border-0">
              {TOOLS.map((tool) => (
                <ToolCard key={tool.name} tool={tool} />
              ))}
            </div>
          </div>
        </div>

        {/* 3. Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border border-b border-border">
          <div className="lg:col-span-2 flex flex-col gap-3 justify-center p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Stack
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Built on the AI primitives that ship in production.
            </h2>
          </div>
          <div className="lg:col-span-4 !p-0 border-0">
            <UseCaseStack items={[...STACK]} />
          </div>
        </div>

        {/* 4. Process */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border border-b border-border">
          <div className="p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Process
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Three lines.
            </h2>
          </div>
          <div className="lg:col-span-2 p-6 lg:p-10">
            <ol className="flex flex-col gap-4">
              {STEPS.map((step, idx) => (
                <li key={step} className="flex gap-4">
                  <span className="text-copy-13-mono text-violet-600 dark:text-violet-400 shrink-0 w-8">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <p className="text-copy-16 text-foreground leading-7 [&:not(:first-child)]:mt-0">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* 5. Proof */}
        <div className="border-b border-border">
          <div className="flex flex-col gap-3 p-6 lg:p-10 max-w-3xl">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              From the pilot
            </p>
            <blockquote className="text-copy-20 lg:text-copy-24 text-foreground leading-snug font-medium text-balance [&:not(:first-child)]:mt-0">
              &ldquo;Our agent went from 60% tool-call success rate to 94% by
              switching to typed tools. Same model, same prompt. The schema was
              the unlock.&rdquo;
            </blockquote>
            <footer className="flex items-center gap-3 pt-4 [&:not(:first-child)]:mt-0">
              <span
                aria-hidden
                className="flex size-9 items-center justify-center rounded-full border border-border bg-muted/40 text-label-13 text-foreground"
              >
                AK
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-label-13 text-foreground">
                  Pilot team, AI tooling
                </span>
                <span className="text-label-12 text-muted-foreground">
                  DeesseJS preview
                </span>
              </span>
            </footer>
          </div>
        </div>

        {/* 6. CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
          <div className="lg:col-span-2 flex flex-col gap-4 p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Get started
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Start from the tool registry, not from scratch.
            </h2>
            <CopyCommand command="deessejs init ai-chatbot" className="mt-2" />
            <p className="text-copy-13-mono text-muted-foreground [&:not(:first-child)]:mt-0">
              or run{" "}
              <span className="text-foreground/90">deessejs init --help</span> for
              the full list.
            </p>
          </div>
          <div className="flex flex-col gap-3 p-6 lg:p-10 bg-violet-500/5">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Or ship with us
            </p>
            <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
              Your agent, our contracts.
            </h3>
            <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
              We build the agent surface with you, on the same template.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-copy-14 text-violet-700 dark:text-violet-400 hover:underline underline-offset-4"
            >
              Talk to delivery
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>

        {/* 7. Related */}
        <div className="border-t border-border grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
          <div className="lg:col-span-2 flex flex-col gap-3 justify-center p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Explore
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Related use cases.
            </h2>
          </div>
          <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border !p-0 border-0">
            {RELATED.map((item) => (
              <Link
                key={item.slug}
                href={`/use-cases/${item.slug}`}
                className="group flex flex-col gap-2 p-6 lg:p-8 transition-colors hover:bg-accent/40"
              >
                <p className="text-label-13 text-muted-foreground">Related</p>
                <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
                  {item.title}
                </h3>
                <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0 line-clamp-3">
                  {item.tagline}
                </p>
                <p className="text-label-13 text-foreground inline-flex items-center gap-1 pt-1">
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
    <div className="flex flex-col gap-3 p-5 lg:p-6 hover:bg-background transition-colors">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md border border-violet-500/30 bg-violet-500/10">
          <Icon className="size-3.5 text-violet-600 dark:text-violet-400" aria-hidden />
        </span>
        <code className="text-copy-13-mono font-medium text-foreground">
          {tool.name}
        </code>
      </div>
      <p className="text-copy-13 text-muted-foreground leading-5 [&:not(:first-child)]:mt-0">
        {tool.description}
      </p>
      <dl className="flex flex-col gap-1 mt-auto pt-2 border-t border-violet-500/20">
        <div className="flex gap-2 text-label-12">
          <dt className="text-muted-foreground/70 shrink-0 w-12">in:</dt>
          <dd className="font-mono text-foreground/80 truncate">{tool.inputs}</dd>
        </div>
        <div className="flex gap-2 text-label-12">
          <dt className="text-muted-foreground/70 shrink-0 w-12">out:</dt>
          <dd className="font-mono text-foreground/80 truncate">{tool.outputs}</dd>
        </div>
      </dl>
    </div>
  )
}
