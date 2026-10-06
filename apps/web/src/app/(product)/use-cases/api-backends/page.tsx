import type { Metadata } from "next"
import { codeToHtml } from "shiki"
import Link from "next/link"
import {
  RelatedUseCases,
  type RelatedUseCaseItem,
} from "../_components/related-use-cases"

import { Section } from "@/app/(marketing)/_components/section"
import { SectionHeader } from "@/app/(marketing)/_components/section-header"
import { UseCaseHero } from "../_components/use-case-page"
import { TechStackGrid } from "@/app/(marketing)/_components/tech-stack-grid"
import { UseCaseTabs } from "../_components/use-case-tabs"
import { API_BACKENDS_SNIPPETS, type ApiBackendsPillarSlug } from "../_components/api-backends-snippets"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

import { GROUP_1, GROUP_2 } from "./api-backends-tabs"

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
  { name: "Hono",        logo: "cloudflare" },
  { name: "oRPC",        logo: "cloudflare" },
  { name: "Drizzle",     logo: "drizzle" },
  { name: "Postgres",    logo: "postgresql" },
  { name: "Better Auth", logo: "betterauth" },
  { name: "Cloudflare",  logo: "cloudflare" },
  { name: "Turborepo",   logo: "vercel" },
  { name: "Resend",      logo: "resend" },
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
] as const satisfies ReadonlyArray<RelatedUseCaseItem>

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
export default async function ApiBackendsPage() {
  const htmlBySlug: Record<string, { tabName: string; html: string }[]> = {
    "orpc-router": [], "drizzle-schema": [], "rate-limit": [], "audit-log": [],
    "openapi-gen": [], "pgmem-test": [], "service-token": [], "otel-waterfall": [],
  }

  await Promise.all(
    (Object.keys(API_BACKENDS_SNIPPETS) as ApiBackendsPillarSlug[]).flatMap((slug) =>
      API_BACKENDS_SNIPPETS[slug].files.map((file) =>
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

      {/* 2. What's in the box — 4 tabs (customer surface). */}
      <Section>
        <SectionHeader
          eyebrow="What's in the box"
          title="The four sub-systems a service-only backend needs."
          subtitle="Eight capabilities grouped by the buyer-side question they answer. Two halves: what the partner integration calls, and what keeps the service running in production."
          bordered={true}
        />
        <UseCaseTabs pillars={GROUP_1} htmlBySlug={htmlBySlug} />
      </Section>

      {/* 3. Behind the curtain — 4 tabs (operational), mirrored. */}
      <Section>
        <SectionHeader
          eyebrow="Behind the curtain"
          title="What keeps an API serviceable."
          subtitle="The four sub-systems an on-call engineer names first. OpenAPI generation, the test harness, service tokens, audit log — all on the same typed contract."
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
            How an API backend ships.
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
      <RelatedUseCases items={RELATED} />

      <FinalCta />
    </div>
  )
}
