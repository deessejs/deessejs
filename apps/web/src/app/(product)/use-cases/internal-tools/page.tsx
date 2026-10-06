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
import { TechStackGrid } from "@/app/(marketing)/_components/tech-stack-grid"
import { UseCaseTabs } from "../_components/use-case-tabs"
import { INTERNAL_TOOLS_SNIPPETS, type InternalToolsPillarSlug } from "../_components/internal-tools-snippets"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

import { GROUP_1, GROUP_2 } from "./internal-tools-tabs"

export const metadata: Metadata = {
  title: "Internal tools | DeesseJS",
  description:
    "Admin dashboards and operator consoles that work behind SSO.",
}

/**
 * Stack specific to the internal-tools surface. Same shape as
 * the other use-case pages so the brand display stays uniform.
 */
const STACK = [
  { name: "Next.js",     logo: "vercel" },
  { name: "Better Auth", logo: "betterauth" },
  { name: "TanStack",    logo: "cloudflare" },
  { name: "shadcn/ui",   logo: "shadcnui" },
  { name: "Drizzle",     logo: "drizzle" },
  { name: "Postgres",    logo: "postgresql" },
  { name: "Turborepo",   logo: "vercel" },
  { name: "Resend",      logo: "resend" },
] as const

const STEPS = [
  {
    heading: "Auth behind the same wall",
    body:
      "Better Auth on the admin subdomain. SSO and roles wired against your existing user table.",
  },
  {
    heading: "Operators see what they should",
    body:
      "Scoped roles, audit log, and rate limits. The contract that gates your customer app gates your support console too.",
  },
  {
    heading: "No second codebase to maintain",
    body:
      "The operator console consumes the same Drizzle schema and the same Better Auth sessions as the customer surface. One type system, one deploy.",
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
    slug: "open-source",
    title: "Open source",
    tagline:
      "Maintainer-friendly starters, MIT-licensed, versioned through the same registry.",
  },
  {
    slug: "ai-products",
    title: "AI products",
    tagline:
      "RAG, chat, and agents wired against the same contracts your app uses.",
  },
] as const satisfies ReadonlyArray<RelatedUseCaseItem>

const BUILT_TEMPLATES = [
  { slug: "admin-console",  title: "admin-console",  body: "KPI roll-ups, user table, bulk actions." },
  { slug: "audit-explorer", title: "audit-explorer", body: "Search and replay every cross-org call." },
  { slug: "feature-flags",  title: "feature-flags",  body: "Per-org, per-plan flag targeting + history." },
  { slug: "support-inbox",  title: "support-inbox",  body: "Tickets land in the same DB the customer uses." },
] as const

export default async function InternalToolsPage() {
  const htmlBySlug: Record<string, { tabName: string; html: string }[]> = {
    "better-auth-rbac": [], "admin-table": [], "ticket-in-context": [], "feature-flag": [],
    "impersonate": [], "audit-replay": [], "csat-tracker": [], "scheduled-job": [],
  }

  await Promise.all(
    (Object.keys(INTERNAL_TOOLS_SNIPPETS) as InternalToolsPillarSlug[]).flatMap((slug) =>
      INTERNAL_TOOLS_SNIPPETS[slug].files.map((file) =>
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
        category="Internal"
        title="Operator consoles behind SSO, on the same contracts."
        body="Admin panels, support inboxes, audit tools. Same Better Auth, same RBAC, same audit trail as the customer-facing app. The four sub-systems an internal tool needs are wired into the registry before your first commit."
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
          title="The four sub-systems every internal tool needs."
          subtitle="Eight capabilities grouped by the buyer-side question they answer. Two halves: what the operator sees, and what keeps the support team accountable."
          bordered={true}
        />
        <UseCaseTabs pillars={GROUP_1} htmlBySlug={htmlBySlug} />
      </Section>

      {/* 3. Behind the curtain — 4 tabs (governance), mirrored. */}
      <Section>
        <SectionHeader
          eyebrow="Behind the curtain"
          title="What keeps an internal tool safe."
          subtitle="The four sub-systems an audit reviewer names first. Impersonation, audit replay, CSAT, scheduled jobs — all on the same typed contract as the customer surface."
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
            How an internal tool ships.
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
