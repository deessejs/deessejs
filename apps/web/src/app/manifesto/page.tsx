import Link from "next/link"
import type { Metadata } from "next"

import { H1, H2 } from "@workspace/ui/components/typography"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

export const metadata: Metadata = {
  title: "Manifesto",
  description:
    "The beliefs that shape how DeesseJS builds software, ships templates, and thinks about the agentic era.",
}

/**
 * Manifesto at /manifesto.
 *
 * Long-form page that doubles as a brand explainer: a visitor who
 * lands here should walk away understanding what DeesseJS believes
 * and how that shapes the tools we ship.
 *
 * Layout:
 *   ┌─ Hero: title + lead + meta row ──────────────┐
 *   │  "Last updated" · "6 beliefs" · reading time  │
 *   ├─ Intro: one-paragraph framing ─────────────────┤
 *   ├─ 6 numbered beliefs (long-form) ───────────────┤
 *   ├─ Closing CTA: links to /about, /principles,   │
 *   │  /vision                                       │
 *   └──────────────────────────────────────────────┘
 *
 * Copy is placeholder — replace with the real convictions
 * once the founding text lands. Tone matches DeesseJS's
 * agentic, modern-stack, opinionated-defaults DNA (see
 * documents/internal/product/positioning.md for source
 * language).
 */

type Belief = {
  number: string
  title: string
  body: string
}

const BELIEFS: ReadonlyArray<Belief> = [
  {
    number: "01",
    title: "Agents are the developers now",
    body: "The next platform shift is autonomous agents shipping production code. Templates should be shaped for the agents that ship them — clear boundaries, machine-readable metadata, hooks over conventions. If a template can't be navigated by a coding agent, it isn't done.",
  },
  {
    number: "02",
    title: "Opinionated defaults, modular everything",
    body: "We pick the stack — Next.js, Better Auth, Drizzle, shadcn/ui, Tailwind v4 — and we ship it wired. Every primitive is removable without breaking the rest. The opinions give speed; the modularity gives longevity.",
  },
  {
    number: "03",
    title: "Speed is the feature",
    body: "A good template lands in minutes, debugged in seconds, understood in a single read. We treat every file that survived PR review as a place where someone will live for the next three years. Documentation in the file beats documentation in a wiki.",
  },
  {
    number: "04",
    title: "The CLI is the product surface",
    body: "A discoverable, composable CLI — `deessejs init`, `deessejs list`, `deessejs update` — is how developers adopt a system. We invest in the terminal because that's where the time adds up. The web surface is where humans browse; the CLI is where they ship.",
  },
  {
    number: "05",
    title: "Open source, with guardrails",
    body: "DeesseJS templates, contracts, and the CLI are MIT. The brand, the marketplace positioning, and the curated registry stay ours. The source-code ecosystem is shared; the product surface is owned.",
  },
  {
    number: "06",
    title: "Ship the smallest useful thing",
    body: "We don't wait for the full vision to release the first slice. Templates, the registry, the SDK — they land as they become useful, and they evolve in the open. The roadmap is a public draft. The community is part of how we build, not who we build for.",
  },
] as const

export default function ManifestoPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-16 px-4 py-16 sm:px-6 lg:py-24">
      {/* Hero */}
      <header className="flex flex-col gap-6">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          The DeesseJS Manifesto
        </p>
        <H1>Software that builds software.</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 [&:not(:first-child)]:mt-0">
          Six beliefs that shape how we design templates, ship
          defaults, and think about the agentic era.
        </p>
        <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-copy-13 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <dt>Last updated</dt>
            <dd className="text-foreground">2026-08-04</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt>Beliefs</dt>
            <dd className="text-foreground">{BELIEFS.length}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt>Reading time</dt>
            <dd className="text-foreground">~ 5 min</dd>
          </div>
        </dl>
      </header>

      <Separator />

      {/* Intro */}
      <section className="flex flex-col gap-4">
        <p className="text-copy-18 text-foreground leading-7">
          DeesseJS is the main app of a small team building the
          templates, contracts, and tooling we wished existed when
          we shipped our last product. We work in public, in the
          open, and in the same stack most of our readers will
          reach for tomorrow.
        </p>
        <p className="text-copy-16 text-muted-foreground leading-7">
          These six beliefs are the rules we hold each other to
          when the easy call is to ship something less careful.
          They are not a manifesto in the sense of a manifesto
          being authoritative — they are the document we rewrite
          whenever we need to remember why we&apos;re here.
        </p>
      </section>

      {/* Beliefs */}
      <section className="flex flex-col gap-12">
        {BELIEFS.map((belief) => (
          <article key={belief.number} className="flex flex-col gap-3">
            <header className="flex items-baseline gap-4">
              <span className="text-label-16 font-mono text-muted-foreground">
                {belief.number}
              </span>
              <h2 className="text-heading-24 tracking-tight text-foreground !m-0">
                {belief.title}
              </h2>
            </header>
            <p className="text-copy-16 text-foreground leading-7 [&:not(:first-child)]:mt-0">
              {belief.body}
            </p>
          </article>
        ))}
      </section>

      <Separator />

      {/* Cross-link CTA */}
      <nav
        aria-label="Related pages"
        className="flex flex-col gap-6"
      >
        <H2>Read next</H2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            href="/vision"
            className="flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
          >
            <span className="text-label-14 font-semibold text-foreground">
              Vision
            </span>
            <span className="text-copy-13 text-muted-foreground">
              Where we&apos;re taking this next.
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
        <div className="flex justify-center pt-2">
          <Button variant="outline" asChild>
            <Link href="/templates">Browse templates</Link>
          </Button>
        </div>
      </nav>
    </article>
  )
}