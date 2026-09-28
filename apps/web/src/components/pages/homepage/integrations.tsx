import Link from "next/link"

import { Section } from "@/app/(marketing)/_components/section"

/**
 * Integrations — v3 (tech card grid).
 *
 * Replaces both the v1 'Bring your own providers' 2-column logo wall
 * and the v2 '6 contracts × providers' block grid. Organised around
 * the technologies themselves rather than around categories — each
 * card is a self-contained tile with its logo, name, one-line
 * description, and a Learn more link that routes to /stack/<slug>.
 *
 * Pattern inspired by trigger.dev's 'True runtime freedom for
 * developers' section but adapted to this repo's design tokens:
 * card chrome uses the shared-border rectangle (border border-border
 * bg-background) rather than trigger.dev's flat-with-no-border
 * aesthetic, so the section reads as part of the same shared-border
 * rhythm as every other section on the homepage.
 *
 * 12 technologies hardcoded. Every href resolves to /stack/<slug>
 * which is not yet a real route — the links 404 today and will
 * activate when the stack detail page ships.
 *
 * Logo slugs match the simple-icons / t3.codes convention and
 * resolve to `/public/logos/<slug>.svg`. SVGs use fill='currentColor'
 * so they render in monochrome via the existing dark:invert +
 * text-foreground inheritance.
 */

type Tech = {
  /** Brand slug that resolves to /public/logos/<slug>.svg. */
  logo: string
  /** Display name shown on the card. */
  name: string
  /** Editorial group label, rendered as a small uppercase caption. */
  group: string
  /** One-line positioning sentence — what the tech gives the user. */
  description: string
  /** Route segment for /stack/<slug>. */
  slug: string
}

const TECHS: ReadonlyArray<Tech> = [
  {
    logo: "nextdotjs",
    name: "Next.js",
    group: "Framework",
    description: "The default surface for every Pro template — server components, App Router, edge runtime.",
    slug: "nextjs",
  },
  {
    logo: "astro",
    name: "Astro",
    group: "Framework",
    description: "Island architecture for marketing surfaces and docs sites that ship near-zero JS by default.",
    slug: "astro",
  },
  {
    logo: "react",
    name: "React",
    group: "Framework",
    description: "The contract layer is React-typed. Any React-compatible framework consumes the same templates.",
    slug: "react",
  },
  {
    logo: "vuedotjs",
    name: "Vue",
    group: "Framework",
    description: "Supported via the same oRPC procedure types. Bind the same contracts from a Vue front-end.",
    slug: "vue",
  },
  {
    logo: "vercel",
    name: "Vercel",
    group: "Hosting",
    description: "Default deploy target. Edge functions, ISR, and preview deployments out of the box.",
    slug: "vercel",
  },
  {
    logo: "cloudflare",
    name: "Cloudflare",
    group: "Hosting",
    description: "Workers, R2, Queues, D1. The templates deploy to Cloudflare without code changes.",
    slug: "cloudflare",
  },
  {
    logo: "supabase",
    name: "Supabase",
    group: "Data",
    description: "Hosted Postgres with auth, storage, and realtime. The Database contract adapts to the Supabase shape.",
    slug: "supabase",
  },
  {
    logo: "postgresql",
    name: "Postgres",
    group: "Data",
    description: "Any wire-compatible host works. The Drizzle schema is the source of truth, ported anywhere.",
    slug: "postgres",
  },
  {
    logo: "stripe",
    name: "Stripe",
    group: "Billing",
    description: "Default billing provider. Subscriptions, usage metering, and webhooks via the Billing contract.",
    slug: "stripe",
  },
  {
    logo: "resend",
    name: "Resend",
    group: "Email",
    description: "Default transactional email. Templates ship with React Email components wired to the auth flow.",
    slug: "resend",
  },
  {
    logo: "drizzle",
    name: "Drizzle",
    group: "Data",
    description: "Default ORM. Type-safe queries, migrations, and a single schema source for the whole stack.",
    slug: "drizzle",
  },
  {
    logo: "sentry",
    name: "Sentry",
    group: "Observability",
    description: "Errors and performance tracing. Plugs into the same OTel pipeline as the rest of the observability contract.",
    slug: "sentry",
  },
]

export function Integrations() {
  return (
    <Section>
      <div className="flex flex-col gap-4 p-6 lg:p-10 border-b border-border">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Plays well with
        </p>
        <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
          Bring the stack you already use.
        </h2>
        <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
          Every template is wired against the 6 contracts, not a
          fixed set of brands. Run the frameworks, hosts, and
          providers your team already knows — and swap the rest
          without rewriting your app.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {TECHS.map((tech) => (
          <Link
            key={tech.slug}
            href={`/stack/${tech.slug}`}
            className="group/tech flex flex-col gap-4 border-b border-r border-border p-6 transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:p-8"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/logos/${tech.logo}.svg`}
              alt=""
              width={28}
              height={28}
              className="size-7 shrink-0 dark:invert"
              aria-hidden
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-label-13 uppercase tracking-wider text-muted-foreground">
                {tech.group}
              </span>
              <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
                {tech.name}
              </h3>
              <p className="text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
                {tech.description}
              </p>
            </div>
            <span
              aria-hidden
              className="mt-auto inline-flex items-center gap-1 text-label-13 text-foreground transition-transform duration-150 group-hover/tech:translate-x-0.5"
            >
              Learn more
              <span aria-hidden>→</span>
            </span>
          </Link>
        ))}
      </div>
    </Section>
  )
}
