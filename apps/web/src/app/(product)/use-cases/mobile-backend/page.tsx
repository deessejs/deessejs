import type { Metadata } from "next"
import Link from "next/link"
import {
  RelatedUseCases,
  type RelatedUseCaseItem,
} from "../_components/related-use-cases"

import { UseCaseHero } from "../_components/use-case-page"
import { TechStackGrid } from "@/app/(marketing)/_components/tech-stack-grid"
import { CapabilityClustersSection } from "../_components/capability-cluster"
import {
  ApiEndpointMockup,
  AuthFlowMockup,
  NotificationsInboxMockup,
  OtelWaterfallMockup,
} from "../_components/mockups"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

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

/**
 * Four thematic clusters of capabilities for a mobile-backend buyer
 * (native client side of the same backend). Same shape as
 * /use-cases/saas-apps and /use-cases/ai-products.
 */
const CAPABILITY_CLUSTERS = [
  {
    id: "identity",
    iconName: "Lock",
    title: "Identity across form factors",
    lead:
      "The same user table, the same session token, the same org boundary — phone, web, watch, tablet.",
    rows: [
      {
        id: "shared-session",
        title: "Sessions shared with the web app",
        body:
          "Better Auth issues a single session, validated by the same public key from the web app. Sign in on web, pick up on the device. The device's session isn't a separate identity to provision, rotate, or revoke — it lives next to the user's other sessions.",
      },
      {
        id: "platform-attestation",
        title: "Apple/Google attestation, optional",
        body:
          "For apps that need it, App Attest and Play Integrity sit on top of the same session. Verified against the same auth middleware the rest of your app uses, with no second vendor to contract.",
      },
      {
        id: "org-scoped",
        title: "Org-scoped, by default",
        body:
          "A device belongs to one org at a time, but switching works. The session carries the org boundary the same way the web session does — the device never sees cross-org data without an explicit org switch.",
      },
    ],
  },
  {
    id: "offline-sync",
    iconName: "RefreshCw",
    title: "Offline-first sync",
    lead:
      "The client can lose the network and still ship work. The server reconciles on reconnect, not on tap.",
    rows: [
      {
        id: "drizzle-cache",
        title: "Drizzle shapes the offline cache",
        body:
          "The same Drizzle schema your server reads defines the offline cache on the device. Reads return from cache, writes queue locally, the reconciler replays them on reconnect — no separate ORM on the client.",
      },
      {
        id: "realtime-bridge",
        title: "Realtime bridge, opt-in",
        body:
          "When the network is there, Server-Sent Events push the same deltas your web client already gets. The bridge lives on your existing oRPC procedure, not a third pub/sub.",
      },
      {
        id: "conflict-resolution",
        title: "Conflict resolution at the source",
        body:
          "Conflicts resolve at the row, not the row+timestamp table. The same Drizzle migration runs offline; the server applies the migration on first reconnect; the client and the server converge on the same schema.",
      },
    ],
  },
  {
    id: "push-and-realtime",
    iconName: "BellRing",
    title: "Push + realtime channels",
    lead:
      "Wake the app for what matters. Don't wake it for what doesn't.",
    rows: [
      {
        id: "expo-push",
        title: "Expo Push, through your queue",
        body:
          "Push notifications route through the same background-job contract the rest of your app uses. A delayed job is a delayed push; a failed push is a retryable job. The queue's dashboard is the push dashboard.",
      },
      {
        id: "targeting",
        title: "Targeting at the schema level",
        body:
          "Push targets resolve from the same query layer web push uses — org, role, last-active, geo. The targeting rules live next to the notification, not in a separate vendor console.",
      },
      {
        id: "in-app-inbox",
        title: "In-app inbox, shared with email",
        body:
          "An in-app inbox the user can scan when push misses (or when they've silenced notifications). The inbox is a query against the same notification table your transactional mail reads — one source of truth.",
      },
    ],
  },
  {
    id: "observability",
    iconName: "Activity",
    title: "Device + network observability",
    lead:
      "What happened on the phone, end to end. Same traces as the web app, in the same dashboard.",
    rows: [
      {
        id: "client-traces",
        title: "Spans from the device",
        body:
          "OpenTelemetry spans from the device (cold start, first paint, network roundtrip) land on the same pipeline your HTTP routes already use. A 5-second cold start on a Pixel 7 has a trace ID you can grep.",
      },
      {
        id: "crash-and-anr",
        title: "Crash + ANR reports, correlated",
        body:
          "Crash and ANR reports reference the trace ID of the failing request. The support engineer can answer 'why did this user get stuck on the checkout screen?' from a single run, not three.",
      },
      {
        id: "cost-and-battery",
        title: "Battery + cost budgets",
        body:
          "Per-device battery cost and per-session network budget surface in the same dashboard as your server costs. A backround-job pattern that burns the user's battery is a bug, not a feature.",
      },
    ],
  },
] as const

/**
 * Mockup map keyed by cluster.id. One real mockup per cluster.
 *   - AuthFlowMockup             → Identity
 *   - ApiEndpointMockup          → Offline sync (RPC contract view)
 *   - NotificationsInboxMockup   → Push + realtime
 *   - OtelWaterfallMockup        → Observability
 */
const CLUSTER_MOCKUPS = {
  "identity":          <AuthFlowMockup />,
  "offline-sync":      <ApiEndpointMockup />,
  "push-and-realtime": <NotificationsInboxMockup />,
  "observability":     <OtelWaterfallMockup />,
} as const

export default function MobileBackendPage() {
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

      {/* 2. What's in the box — four capability clusters */}
      <section className="border-b border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-10 lg:px-10 lg:py-12">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            What&apos;s in the box
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            The four sub-systems every mobile app needs.
          </h2>
          <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Twelve capabilities grouped by the buyer-side question
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
