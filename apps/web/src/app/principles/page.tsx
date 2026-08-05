import Link from "next/link"
import type { Metadata } from "next"

import { H1, H2 } from "@workspace/ui/components/typography"
import { Card } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"

export const metadata: Metadata = {
  title: "Principles",
  description:
    "How the DeesseJS team works — operating tenets that guide day-to-day decisions on the project.",
}

/**
 * Principles at /principles.
 *
 * Grid of operating principles — the day-to-day rules the team
 * follows, complementing the more philosophical /manifesto. A
 * visitor who reads both should leave with both the *why* and the
 * *how*.
 *
 * Layout:
 *   ┌─ Hero: title + lead ──────────────────────────┐
 *   ├─ 3×3 grid of principle cards ─────────────────┤
 *   ├─ Closing "Read next" nav ──────────────────────┤
 *   └──────────────────────────────────────────────┘
 *
 * Copy is placeholder — placeholder copy mirrors the
 * /manifesto's tone (agentic, modern stack, opinionated
 * defaults) but applied as operational rules rather than
 * philosophical beliefs.
 */

type Principle = {
  number: string
  title: string
  body: string
}

const PRINCIPLES: ReadonlyArray<Principle> = [
  {
    number: "I.",
    title: "Ship the smallest useful thing",
    body:
      "Every release answers one question. We cut scope until the remaining change is small enough to merge with full attention. The roadmap stays public so users see what's next and what's intentionally not yet.",
  },
  {
    number: "II.",
    title: "Public by default",
    body:
      "Specs, decisions, and tradeoffs live in the open. We document in the file, not in a wiki. Decisions are recorded in the docs they affect, with their context, so a future reader can rebuild the choice from first principles.",
  },
  {
    number: "III.",
    title: "Two-way door first",
    body:
      "Reversible changes ship fast. Irreversible ones earn design docs, second reviews, and a runbook. We bias toward options we can walk back from, and we name the few we cannot.",
  },
  {
    number: "IV.",
    title: "Templates are test fixtures",
    body:
      "Every DeesseJS template is built once, smoke-tested, versioned, and reused. If a template needs custom logic that doesn't generalize, it stays a private fork — the registry earns its name by curating what survives contact with production.",
  },
  {
    number: "V.",
    title: "The CLI is the contract",
    body:
      "Anything users do often lives in the CLI. The web surface explains; the terminal ships. When the two diverge, the terminal wins — that's where time accumulates.",
  },
  {
    number: "VI.",
    title: "Modular before clever",
    body:
      "We split until each file has one job, then we stop. Reusable primitives live in packages/* with their own tests, their own version, their own release cadence. Cross-package coupling is a smell.",
  },
  {
    number: "VII.",
    title: "Defaults over configuration",
    body:
      "We ship defaults that work for 80% of cases. Configuration exists for the 20%; we don't apologize for hiding it under a flag. Every option we expose is a future option someone has to maintain.",
  },
  {
    number: "VIII.",
    title: "Observability is a feature",
    body:
      "If we can't see it, we can't ship it. Logs, traces, and metrics land with the feature, not after. Internal tools get the same telemetry treatment as user-facing ones.",
  },
  {
    number: "IX.",
    title: "Pause before adding",
    body:
      "We add things on purpose. The default answer to a new dependency, a new endpoint, a new env var, a new product surface is *not yet*. If the case grows louder after a week of waiting, we revisit. Otherwise, we let it go.",
  },
] as const

export default function PrinciplesPage() {
  return (
    <article className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:gap-20 lg:py-24">
      {/* Hero */}
      <header className="flex flex-col gap-6">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          How we work
        </p>
        <H1>Principles.</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
          The day-to-day operating rules that complement the
          {" "}<Link href="/manifesto" className="underline-offset-4 hover:underline text-foreground">manifesto</Link>. Most of them
          were earned the hard way.
        </p>
      </header>

      <Separator />

      {/* Principles grid */}
      <section className="flex flex-col gap-6">
        <H2>The nine tenets</H2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((principle) => (
            <Card
              key={principle.number}
              className="flex h-full flex-col gap-3 p-6"
            >
              <span className="text-label-13 font-mono text-muted-foreground">
                {principle.number}
              </span>
              <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                {principle.title}
              </h3>
              <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                {principle.body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Cross-link CTA */}
      <nav
        aria-label="Related pages"
        className="flex flex-col gap-6"
      >
        <H2>Read next</H2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            href="/vision"
            className="flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
          >
            <span className="text-label-14 font-semibold text-foreground">
              Vision
            </span>
            <span className="text-copy-13 text-muted-foreground">
              Where this is going next.
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
        </div>
      </nav>
    </article>
  )
}