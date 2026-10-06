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
import { MOBILE_BACKEND_SNIPPETS, type MobileBackendPillarSlug } from "../_components/mobile-backend-snippets"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

import { GROUP_1, GROUP_2 } from "./mobile-backend-tabs"

export const metadata: Metadata = {
  title: "Mobile backend | DeesseJS",
  description:
    "Auth, sync, and push notifications for native apps, on the same backend.",
}

/**
 * Stack specific to the mobile surface. Same TechStackGrid shape as the
 * other 4 migrated use-case pages so the brand display stays uniform.
 */
const STACK = [
  { name: "Hono",        logo: "cloudflare" },
  { name: "Better Auth", logo: "betterauth" },
  { name: "Drizzle",     logo: "drizzle" },
  { name: "Expo",        logo: "expo" },
  { name: "Resend",      logo: "resend" },
] as const

const STEPS = [
  {
    heading: "Same auth, same contracts",
    body:
      "Better Auth issues session tokens your native client validates against the same public keys. No separate identity store.",
  },
  {
    heading: "Wire sync to your existing schema",
    body:
      "Drizzle models the offline cache shape on the client and the source of truth on the server. No glue code.",
  },
  {
    heading: "Push and analytics, wired",
    body:
      "Observability traces from the mobile client land in the same dashboard as your web traces. Push notifications route through your existing queue.",
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
    slug: "ai-products",
    title: "AI products",
    tagline:
      "RAG, chat, and agents wired against the same contracts your app uses.",
  },
] as const satisfies ReadonlyArray<RelatedUseCaseItem>

/**
 * First-party templates the org has built on this surface. Pre-launch,
 * so href="#" placeholders. Same 4-card / lg:grid-cols-4 grid as the
 * other migrated pages.
 */
const BUILT_TEMPLATES = [
  { slug: "expo-starter",  title: "expo-starter",  body: "Expo app wired against Hono and Better Auth." },
  { slug: "offline-cache", title: "offline-cache", body: "Drizzle-backed offline queue with conflict resolution." },
  { slug: "push-relay",    title: "push-relay",    body: "Expo push + Resend, routed through your existing queue." },
  { slug: "device-traces", title: "device-traces", body: "OpenTelemetry spans from the client into the same backend." },
] as const
export default async function MobileBackendPage() {
  const htmlBySlug: Record<string, { tabName: string; html: string }[]> = {
    "better-auth-session": [], "drizzle-offline-queue": [], "expo-push-relay": [], "otel-client-span": [],
    "app-attest": [], "conflict-resolve": [], "targeting-query": [], "crash-correlate": [],
  }

  await Promise.all(
    (Object.keys(MOBILE_BACKEND_SNIPPETS) as MobileBackendPillarSlug[]).flatMap((slug) =>
      MOBILE_BACKEND_SNIPPETS[slug].files.map((file) =>
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
        category="Mobile"
        title="The same backend, with a transport that fits the client."
        body="JSON or gRPC over the same contracts the web app uses. No separate mobile auth flow to maintain."
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
          title="The four sub-systems every mobile app needs."
          subtitle="Eight capabilities grouped by the buyer-side question they answer. Two halves: what the user does on the device, and what keeps the app in sync with the backend."
          bordered={true}
        />
        <UseCaseTabs pillars={GROUP_1} htmlBySlug={htmlBySlug} />
      </Section>

      {/* 3. Behind the curtain — 4 tabs (device), mirrored. */}
      <Section>
        <SectionHeader
          eyebrow="Behind the curtain"
          title="What keeps a mobile app in sync."
          subtitle="The four sub-systems a mobile engineer names first. App Attest, conflict resolution, targeting query, crash correlation — all on the same typed contract as the web app."
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
      <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Process
          </p>
          <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            How a mobile backend ships.
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
