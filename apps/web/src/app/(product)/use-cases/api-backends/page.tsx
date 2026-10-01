import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { UseCaseHero } from "../_components/use-case-page"
import { TechStackGrid } from "@/app/(marketing)/_components/tech-stack-grid"
import { CapabilityClustersSection } from "../_components/capability-cluster"
import {
  ApiEndpointMockup,
  DbTerminalMockup,
  OtelWaterfallMockup,
} from "../_components/mockups"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

export const metadata: Metadata = {
  title: "API backends | DeesseJS",
  description:
    "Service-only backends — Hono + oRPC, typed end to end, no frontend overhead.",
}

/**
 * Stack specific to the API surface. Same shape as the other
 * use-case pages so the brand display stays uniform.
 */
const STACK = [
  { name: "Hono",     logo: "cloudflare" },
  { name: "oRPC",     logo: "cloudflare" },
  { name: "Drizzle",  logo: "drizzle" },
  { name: "Postgres", logo: "postgresql" },
] as const

const STEPS = [
  {
    heading: "Define the contract",
    body:
      "The router is the schema. Clients import the type, the server enforces it. No hand-written request/response DTOs.",
  },
  {
    heading: "Wire the storage layer",
    body:
      "Drizzle on Postgres by default. Swap providers without rewriting the API surface — the schema stays the same.",
  },
  {
    heading: "Publish and iterate",
    body:
      "OpenAPI is generated from the router. Clients consume the contract, not the implementation. Versioned deployments sit alongside the code.",
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
    slug: "mobile-backend",
    title: "Mobile backend",
    tagline:
      "Auth, sync, and push notifications for native apps, on the same backend.",
  },
  {
    slug: "ai-products",
    title: "AI products",
    tagline:
      "RAG, chat, and agents wired against the same contracts your app uses.",
  },
] as const

/**
 * First-party template cards the org has built on this surface.
 * The card grid signals production output without requiring
 * links that don't resolve yet.
 */
const BUILT_TEMPLATES = [
  { slug: "rpc-server",       title: "rpc-server",       body: "Hono + oRPC service with Drizzle on Postgres." },
  { slug: "edge-handler",     title: "edge-handler",     body: "Cloudflare worker behind the same typed contract." },
  { slug: "webhook-receiver", title: "webhook-receiver", body: "Signed, retried, typed webhook ingestion." },
  { slug: "service-to-service", title: "service-to-service", body: "Internal RPC with token rotation and audit trail." },
] as const

/**
 * Four thematic clusters of capabilities for an API-backend buyer.
 * Plain prose, no marketing fluff — each row says what shape the
 * buyer actually ships.
 */
const CAPABILITY_CLUSTERS = [
  {
    id: "typed-rpc",
    iconName: "Workflow",
    title: "Typed RPC",
    lead:
      "The wire format is the source of truth. Clients import the type; the server enforces it.",
    rows: [
      {
        id: "router-as-schema",
        title: "Router is the schema",
        body:
          "Procedures live in TypeScript. Inputs, outputs, and errors flow from the router, not from a hand-written DTO. Rename a property and every client fails the build the same day.",
      },
      {
        id: "end-to-end-types",
        title: "End-to-end typed clients",
        body:
          "Generated clients carry input/output types so call sites read like typed function calls. Refactors propagate through the typed layer instead of through stale documentation.",
      },
      {
        id: "openapi",
        title: "OpenAPI from the router",
        body:
          "OpenAPI is generated from the same router the typed clients see. Partner integrations consume a spec that is actually in sync with the implementation, not a hand-trimmed copy.",
      },
    ],
  },
  {
    id: "storage",
    iconName: "Database",
    title: "Storage layer",
    lead:
      "The data shape that the contracts sit on top of. Swap providers without rewriting callers.",
    rows: [
      {
        id: "drizzle",
        title: "Drizzle by default",
        body:
          "Schemas live in TypeScript alongside the contracts. Migrations run from the same CLI you ship to ops. Postgres by default, swap to MySQL or SQLite without rewriting the API surface.",
      },
      {
        id: "typed-queries",
        title: "Typed queries",
        body:
          "Query builders carry the schema types end-to-end: a typo on a column name fails compilation. Tests use pg-mem so the test suite runs without a Postgres in CI.",
      },
      {
        id: "migrations",
        title: "Migration history",
        body:
          "Migrations are generated, never hand-edited. Drift between schema and migrations is impossible because the same source produces both.",
      },
    ],
  },
  {
    id: "auth-and-perimeter",
    iconName: "Lock",
    title: "Auth & perimeter",
    lead:
      "Same auth and rate limits whether the caller is a user, a partner, or another service.",
    rows: [
      {
        id: "auth-on-routes",
        title: "Auth on every procedure",
        body:
          "Better Auth sessions validated per procedure. No global middleware that forgets to wrap the new route — the auth check is on the procedure definition itself.",
      },
      {
        id: "rate-limits",
        title: "Rate limits per route",
        body:
          "Per-route rate limits with named buckets, so /search has a different ceiling than /webhook. Limits surface in the same dashboard as the rest of observability.",
      },
      {
        id: "service-tokens",
        title: "Service-to-service tokens",
        body:
          "Internal callers get scoped, time-bound tokens with rotation. Audit log records every call, who issued the token, and which routes it has touched.",
      },
    ],
  },
  {
    id: "observability",
    iconName: "Activity",
    title: "Observability",
    lead:
      "When a partner files an integration ticket, you already know what changed.",
    rows: [
      {
        id: "otel-traces",
        title: "OpenTelemetry traces",
        body:
          "Every request, every DB query, every outbound call carries a trace ID. One OpenTelemetry pipeline; no second dashboard to monitor.",
      },
      {
        id: "errors-tagged",
        title: "Errors tagged by procedure",
        body:
          "Errors carry the procedure name and the input shape that caused them. Stack traces are usable; breadcrumbs are not a separate system.",
      },
      {
        id: "audit-log",
        title: "Audit trail",
        body:
          "Sensitive operations record the actor, the action, and the resource. Buyers in regulated verticals audit this in the first call; you don't have to explain what 'comprehensive logging' looks like.",
      },
    ],
  },
] as const

/**
 * One mockup per cluster. ApiEndpointMockup covers Typed RPC,
 * DbTerminalMockup covers Storage. Auth and Observability are
 * intentionally shown as static product surfaces — there is
 * no compelling ops-side visual for either, and a quiet
 * preview-unavailable panel would weaken the alternation.
 */
const CLUSTER_MOCKUPS = {
  "typed-rpc":           <ApiEndpointMockup />,
  storage:               <DbTerminalMockup />,
  "auth-and-perimeter":  undefined,
  observability:         <OtelWaterfallMockup />,
} as const

export default function ApiBackendsPage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero */}
      <UseCaseHero
        category="API"
        title="Service-only backends, typed end to end."
        body="Hono + oRPC procedures typed from router to client. Drizzle on Postgres. The four sub-systems a service-only backend needs are wired into the registry before your first commit."
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
            The four sub-systems a service-only backend needs.
          </h2>
          <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Twelve capabilities grouped by the buyer-side question
            they answer. Pick a cluster, read what you actually ship.
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
            How an API backend ships.
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

      {/* 5. Built on this — first-party templates */}
      <section className="flex flex-col border-t border-border">
        <div className="flex flex-col gap-3 px-6 py-10 lg:px-10 lg:py-12 border-b border-border">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Built on this
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            Four templates, each on its own surface.
          </h2>
          <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Production-ready starter templates, each deployed at its
            own URL. Used as the reference set for what the registry
            can ship.
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
