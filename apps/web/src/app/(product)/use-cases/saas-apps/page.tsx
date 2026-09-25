import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { UseCaseHero } from "../_components/use-case-page"
import { TechStackGrid } from "@/app/(marketing)/_components/tech-stack-grid"
import { CapabilitiesTabs } from "../_components/capabilities-tabs"
import {
  AdminDashboardMockup,
  BillingWidgetMockup,
  MultiTenantSwitcherMockup,
  NotificationsInboxMockup,
  OnboardingMockup,
  OtelWaterfallMockup,
  ProductTableMockup,
  QueueLogMockup,
} from "../_components/mockups"
import { FinalCta } from "@/components/pages/use-cases/final-cta"
import { resolveCapabilities } from "../_data"

export const metadata: Metadata = {
  title: "SaaS apps | DeesseJS",
  description:
    "Multi-tenant B2B SaaS with auth, billing, and a working dashboard on day one.",
}

/**
 * Stack specific to the SaaS surface. Six brands, same set the
 * hero CTA already names implicitly. Re-rendered through
 * <TechStackGrid> (the same component the homepage + pricing
 * page use) so every brand display on the site stays in lockstep.
 */
const STACK = [
  { name: "Next.js",     logo: "vercel" },
  { name: "Better Auth", logo: "betterauth" },
  { name: "Drizzle",     logo: "drizzle" },
  { name: "Postgres",    logo: "postgresql" },
  { name: "Stripe",      logo: "stripe" },
  { name: "Resend",      logo: "resend" },
] as const

const STEPS = [
  {
    heading: "Scaffold the stack",
    body: "Run the CLI. The contracts are wired before the first file is generated. Multi-tenant boundaries, rate limiting, and transactional email come preconfigured.",
  },
  {
    heading: "Wire your domain",
    body: "Replace the placeholder with the product. The eight capabilities stay stable, so the surface you ship to customers is the only thing that changes.",
  },
  {
    heading: "Ship to your first customer",
    body: "Auth, billing, jobs, and observability are already in place. Your time goes into the part of the product that customers actually see.",
  },
] as const

const RELATED = [
  {
    slug: "internal-tools",
    title: "Internal tools",
    tagline:
      "Operator consoles that work behind SSO, on the same auth and contracts as your customer app.",
  },
  {
    slug: "api-backends",
    title: "API backends",
    tagline:
      "Service-only backends with type-safe RPC and zero frontend overhead.",
  },
  {
    slug: "ai-products",
    title: "AI products",
    tagline:
      "RAG, chat, and agents wired against the same contracts your app uses.",
  },
] as const

/**
 * First-party templates the org has built on this surface. They
 * each ship on their own hosted URL once published — today they
 * remain pre-launch. The card grid signals production-ready
 * output without requiring links that don't resolve yet.
 */
const BUILT_TEMPLATES = [
  { slug: "saas-starter",  title: "saas-starter",  body: "B2B SaaS scaffold with orgs, billing, dashboard." },
  { slug: "ops-console",   title: "ops-console",   body: "Operator console wired on the same Better Auth and Drizzle schema." },
  { slug: "billing-portal", title: "billing-portal", body: "Stripe customer portal preconfigured for usage metering." },
  { slug: "team-onboarding", title: "team-onboarding", body: "Workspace invite flow with email verify and role assignment." },
] as const

/**
 * Mockup map keyed by capability.mockupSlug. Every SaaS
 * capability gets a real mockup so the right column never
 * shows a placeholder.
 */
const MOCKUPS = {
  onboarding:      <OnboardingMockup />,
  "multi-tenant":  <MultiTenantSwitcherMockup />,
  "product-crud":  <ProductTableMockup />,
  billing:         <BillingWidgetMockup />,
  admin:           <AdminDashboardMockup />,
  "background-jobs": <QueueLogMockup />,
  notifications:   <NotificationsInboxMockup />,
  observability:   <OtelWaterfallMockup />,
} as const

const ICONS = {
  onboarding:        "Mail",
  "multi-tenant":    "Users",
  "product-crud":    "Table2",
  billing:           "CreditCard",
  admin:             "LayoutDashboard",
  "background-jobs": "Workflow",
  notifications:     "Bell",
  observability:     "Activity",
} as const

/**
 * Page wrapper. The wrapper's outer border + bg is provided by
 * GlobalLayout in apps/web/src/app/layout.tsx — we don't render
 * our own card frame, so the page sits flush inside the global
 * card with the same border treatment as the rest of the
 * marketing surface.
 */
export default function SaasAppsPage() {
  const capabilities = resolveCapabilities("saas-apps")

  return (
    <div className="flex flex-col">
      {/* 1. Hero — capabilities (not a single template) */}
      <UseCaseHero
        category="SaaS"
        title="Production-grade B2B SaaS, out of the box."
        body="Multi-tenant auth, billing, an operator console, and the jobs and observability behind it. The eight sub-systems a SaaS needs are wired into the registry before your first commit."
        primaryCta={{
          label: "Use it yourself",
          href: "/templates",
        }}
        secondaryCta={{
          label: "Talk to delivery",
          href: "/delivery",
        }}
      />

      {/* 2. What's in the box — capabilities tabs.
           Mirrors the mental model of the homepage
           <SurfacesTabs>: every card visible at once,
           selected card drives the right-column mockup. */}
      <section className="border-b border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-10 lg:px-10 lg:py-12">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            What&apos;s in the box
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            Eight sub-systems a SaaS needs.
          </h2>
          <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Pick a card, see the preview. Each capability ships with the
            contracts, the tests, and the migration story already wired.
          </p>
        </div>
        <CapabilitiesTabs
          capabilities={capabilities}
          mockups={MOCKUPS}
          iconMap={ICONS}
        />
      </section>

      {/* 3. Stack */}
      {/*    Same TechStackGrid used on the homepage and /pricing.
           Header row on top, brand wall underneath. The brand
           tiles rotate on a swap animation, so the surface
           reads as a living tech stack rather than a static
           logo dump. */}
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
            How a SaaS ships.
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

      {/* 5. Built on this */}
      {/*    Two-row layout: header full-width on top, then 4 cards
           on a single lg:grid-cols-4 row. Each card is fully
           clickable (entire <Link> wrapper) but currently uses
           href="#" since the template URLs are not yet deployed.
           Replace "#" with the live URL when the corresponding
           site ships. Each card carries a grey placeholder
           block at the top (no illustration, no label, no CTA
           below) so the section reads as 4 product surfaces
           waiting to render. */}
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

      {/* 7. Final CTA */}
      <FinalCta />
    </div>
  )
}
