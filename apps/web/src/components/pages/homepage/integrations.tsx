import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Section } from "@/components/marketing/section"

/**
 * Integrations — 2-column layout.
 *
 * Left column (3fr): eyebrow + h2 + 4 bullets in the Vercel-style
 *   'icon + bold + descriptor' pattern.
 *
 * Right column (7fr): 8-tech grid (2 cols x 4 rows on desktop, 1
 *   col on mobile). Each card is a self-contained tile with its
 *   logo, name, one-line description, and a 'Learn more' link that
 *   routes to /stack/<slug>.
 *
 * The 3fr / 7fr ratio targets a 30/70 split (≈384px copy / ≈896px
 * grid at a 1280px viewport) — copy column fits the eyebrow + h2
 * + 4 bullets without compressing them, tech wall stays wide.
 *
 * Inspired by trigger.dev's 'True runtime freedom for developers'
 * section but adapted to this repo's design tokens: card chrome
 * uses the shared-border rectangle (border border-border bg-background)
 * so the section reads as part of the same shared-border rhythm
 * as every other section on the homepage.
 *
 * 8 technologies hardcoded. Every href resolves to /stack/<slug>
 * which is not yet a real route — the links 404 today and will
 * activate when the stack detail page ships.
 */

type Tech = {
  /** Brand slug that resolves to /public/logos/<slug>.svg. */
  logo: string
  /** Display name shown on the card. */
  name: string
  /** One-line positioning sentence — what the tech gives the user. */
  description: string
  /** Route segment for /stack/<slug>. */
  slug: string
}

const TECHS: ReadonlyArray<Tech> = [
  {
    logo: "nextdotjs",
    name: "Next.js",
    description: "The default surface for every Pro template, with server components, App Router, and the edge runtime.",
    slug: "nextjs",
  },
  {
    logo: "astro",
    name: "Astro",
    description: "Island architecture for marketing surfaces and docs sites that ship near-zero JS by default.",
    slug: "astro",
  },
  {
    logo: "react",
    name: "React",
    description: "The contract layer is React-typed. Any React-compatible framework consumes the same templates.",
    slug: "react",
  },
  {
    logo: "vuedotjs",
    name: "Vue",
    description: "Supported via the same oRPC procedure types. Bind the same contracts from a Vue front-end.",
    slug: "vue",
  },
  {
    logo: "vercel",
    name: "Vercel",
    description: "Default deploy target. Edge functions, ISR, and preview deployments out of the box.",
    slug: "vercel",
  },
  {
    logo: "cloudflare",
    name: "Cloudflare",
    description: "Workers, R2, Queues, D1. The templates deploy to Cloudflare without code changes.",
    slug: "cloudflare",
  },
  {
    logo: "postgresql",
    name: "Postgres",
    description: "Any wire-compatible host works. The Drizzle schema is the source of truth, ported anywhere.",
    slug: "postgres",
  },
  {
    logo: "stripe",
    name: "Stripe",
    description: "Default billing provider. Subscriptions, usage metering, and webhooks via the Billing contract.",
    slug: "stripe",
  },
]

export function Integrations() {
  return (
    <Section>
      <div className="grid grid-cols-1 md:grid-cols-[3fr_7fr] divide-y divide-border md:divide-y-0 md:divide-x">
        {/* Left column: copy + bullets */}
        <div className="flex flex-col justify-start gap-4 p-6 lg:gap-6 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Plays well with
          </p>
          <h2 className="max-w-md text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            Bring the stack you already use.
          </h2>
          <p className="max-w-md text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Every template is wired against the 6 contracts, not a
            fixed set of brands. Run the frameworks, hosts, and
            providers your team already knows.
          </p>
          <ul className="flex flex-col gap-3 pt-2">
            <li className="flex items-start gap-3 text-copy-14 leading-6 text-foreground">
              <span
                aria-hidden
                className="mt-0.5 flex h-6 shrink-0 items-center -space-x-3"
              >
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 4 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/github.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 3 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/gitlab.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 2 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/atlassian.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 1 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/azuredevops.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
              </span>
              <span>
                <strong>Deploy automatically</strong> from git or with
                the CLI. No extra config.
              </span>
            </li>
            <li className="flex items-start gap-3 text-copy-14 leading-6 text-foreground">
              <span
                aria-hidden
                className="mt-0.5 flex h-6 shrink-0 items-center -space-x-3"
              >
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 4 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/nextdotjs.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 3 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/astro.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 2 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/vercel.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 1 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/cloudflare.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
              </span>
              <span>
                <strong>Wide range</strong> support for the most
                popular frameworks and hosts.
              </span>
            </li>
            <li className="flex items-start gap-3 text-copy-14 leading-6 text-foreground">
              <span
                aria-hidden
                className="mt-0.5 flex h-6 shrink-0 items-center -space-x-3"
              >
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 4 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/claudecode.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 3 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/codex.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 2 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/cursor.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 1 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/opencode.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
              </span>
              <span>
                <strong>Typed contracts</strong> at every boundary, so
                your agent and your IDE stay in sync.
              </span>
            </li>
            <li className="flex items-start gap-3 text-copy-14 leading-6 text-foreground">
              <span
                aria-hidden
                className="mt-0.5 flex h-6 shrink-0 items-center -space-x-3"
              >
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 4 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/betterauth.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 3 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/clerk.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 2 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/auth0.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
                <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]" style={{ zIndex: 1 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/lucia.svg" alt="" width={14} height={14} className="size-3.5 dark:invert" />
                </span>
              </span>
              <span>
                <strong>Bring your own auth</strong>: Better Auth,
                Clerk, Auth0, Lucia, or your own provider.
              </span>
            </li>
          </ul>

          <Link
            href="/stack"
            className="mt-2 inline-flex items-center gap-1 self-start text-label-13 text-foreground hover:underline underline-offset-4"
          >
            Browse the stack
            <ArrowUpRight aria-hidden className="size-3" />
          </Link>
        </div>

        {/* Right column: 8-tech grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-border md:border-t-0">
          {TECHS.map((tech) => (
            <Link
              key={tech.slug}
              href={`/stack/${tech.slug}`}
              className="group/tech relative flex flex-col gap-3 border-b border-r border-border p-6 transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:p-8"
            >
              <ArrowUpRight
                aria-hidden
                className="absolute right-4 top-4 size-4 shrink-0 text-muted-foreground transition-colors group-hover/tech:text-foreground lg:right-6 lg:top-6"
              />
              <h3 className="flex items-center gap-2 pr-6 text-heading-20 font-medium tracking-tight text-foreground">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/logos/${tech.logo}.svg`}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 shrink-0 dark:invert"
                  aria-hidden
                />
                {tech.name}
              </h3>
              <p className="text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
                {tech.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  )
}
