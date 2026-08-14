import Link from "next/link"
import type { Metadata } from "next"

import { H1, H2 } from "@workspace/ui/components/typography"
import { Card } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"

export const metadata: Metadata = {
  title: "Vision",
  description:
    "Where DeesseJS is heading — the next year of templates, contracts, and agent-aware tooling.",
}

/**
 * Vision at /vision.
 *
 * Long-form page that complements /manifesto (why) and
 * /principles (how) with **where we're going**. Three horizons:
 *   - Now (already shipping)
 *   - Next (in flight, expect this quarter)
 *   - Beyond (aspirational, no dates)
 *
 * Layout:
 *   ┌─ Hero: title + lead ──────────────────────────┐
 *   ├─ Three horizon sections (Now · Next · Beyond) ─┤
 *   ├─ Closing "Read next" nav ──────────────────────┤
 *   └──────────────────────────────────────────────┘
 */

type HorizonItem = {
  title: string
  description: string
}

type Horizon = {
  label: "Now" | "Next" | "Beyond"
  status: "Shipping today" | "In flight this quarter" | "Aspirational"
  tagline: string
  items: ReadonlyArray<HorizonItem>
}

const HORIZONS: ReadonlyArray<Horizon> = [
  {
    label: "Now",
    status: "Shipping today",
    tagline:
      "What you can pull from the registry and the CLI today.",
    items: [
      {
        title: "Curated template registry",
        description:
          "Templates covering SaaS, AI, and landing surfaces, each contract-validated against @workspace/contracts before publish.",
      },
      {
        title: "End-to-end stack defaults",
        description:
          "Next.js, Better Auth, Drizzle, shadcn/ui, Tailwind v4 — wired and ready to run on day one.",
      },
      {
        title: "Public CLI with offline cache",
        description:
          "deessejs init / list / info — works offline, ships with retry and a local ETag-keyed cache.",
      },
      {
        title: "ISR-backed marketing surfaces",
        description:
          "The marketing site renders the catalog server-side, contract-validated, with tag-based revalidation.",
      },
    ],
  },
  {
    label: "Next",
    status: "In flight this quarter",
    tagline:
      "What we are actively building toward. Subject to revision.",
    items: [
      {
        title: "Agent-aware template metadata",
        description:
          "Each template carries machine-readable capabilities, compatible agents, and install hints — so a coding agent can pick and run one without human nudging.",
      },
      {
        title: "Categories + frameworks filter",
        description:
          "The catalog becomes browsable by type and by framework, with multi-select URL state and per-template counts.",
      },
      {
        title: "Multi-tenant auth as a first-class package",
        description:
          "An opt-in package that brings row-level multi-tenancy to new templates without rewiring the auth flow.",
      },
      {
        title: "Vercel preview + CI",
        description:
          "Every PR runs lint, typecheck, unit tests, integration tests, and a Vercel preview deploy. Merges are gated green.",
      },
    ],
  },
  {
    label: "Beyond",
    status: "Aspirational",
    tagline:
      "Where we are heading if everything else goes well. No dates.",
    items: [
      {
        title: "Templates that ship themselves",
        description:
          "An agent reviews the diff, runs the smoke tests, opens the PR, and waits on a human reviewer for sign-off. We write the reviewers.",
      },
      {
        title: "A registry as a marketplace",
        description:
          "Authors ship templates through the same registry we use ourselves — opinionated defaults, versioned, contract-tested. Discovery, install, and update all in one tool.",
      },
      {
        title: "Composable primitives, not stacks",
        description:
          "Stop shipping monoliths. Users pull packages — auth, db, payments, observability — individually, with templates that demonstrate how they fit together.",
      },
      {
        title: "Agent observability as a first-class concern",
        description:
          "The traces, logs, and metrics of an AI agent running your stack are observable by default. We treat the agent as a first-class actor in the system, not a side effect.",
      },
    ],
  },
] as const

export default function VisionPage() {
  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-16 px-4 py-16 sm:px-6 lg:gap-24 lg:py-24">
      {/* Hero */}
      <header className="flex flex-col gap-6">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Where we&apos;re going
        </p>
        <H1>Vision.</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
          Three horizons for the DeesseJS main app — what&apos;s
          shipping today, what we&apos;re building toward next,
          and where we want to land eventually. Revised as the
          roadmap moves.
        </p>
        <p className="text-copy-13 text-muted-foreground">
          Last updated: 2026-08-04.
        </p>
      </header>

      <Separator />

      {/* Horizons */}
      {HORIZONS.map((horizon) => (
        <section key={horizon.label} className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-heading-40 tracking-tight text-foreground !m-0">
                {horizon.label}
              </h2>
              <Badge variant="secondary">{horizon.status}</Badge>
            </div>
            <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
              {horizon.tagline}
            </p>
          </header>

          <ul className="flex flex-col gap-3">
            {horizon.items.map((item) => (
              <li key={item.title}>
                <Card className="flex flex-col gap-2 p-6">
                  <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                    {item.title}
                  </h3>
                  <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                    {item.description}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Separator />

      {/* Cross-link CTA */}
      <nav
        aria-label="Related pages"
        className="flex flex-col gap-6"
      >
        <H2>Read next</H2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/manifesto"
            className="flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
          >
            <span className="text-label-14 font-semibold text-foreground">
              Manifesto
            </span>
            <span className="text-copy-13 text-muted-foreground">
              Why we&apos;re here — the beliefs behind the work.
            </span>
          </Link>
          <Link
            href="/principles"
            className="flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
          >
            <span className="text-label-14 font-semibold text-foreground">
              Principles
            </span>
            <span className="text-copy-13 text-muted-foreground">
              How we work, day to day.
            </span>
          </Link>
          <Link
            href="/about"
            className="flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
          >
            <span className="text-label-14 font-semibold text-foreground">
              About
            </span>
            <span className="text-copy-13 text-muted-foreground">
              Who we are, and how we got here.
            </span>
          </Link>
          <Link
            href="/ecosystem"
            className="flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
          >
            <span className="text-label-14 font-semibold text-foreground">
              Ecosystem
            </span>
            <span className="text-copy-13 text-muted-foreground">
              The sub-domains and shared values.
            </span>
          </Link>
        </div>
      </nav>
    </article>
  )
}