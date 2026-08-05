import Link from "next/link"
import type { Metadata } from "next"

import { H1, H2 } from "@workspace/ui/components/typography"
import { Card } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

export const metadata: Metadata = {
  title: "Ecosystem",
  description:
    "The DeesseJS ecosystem — the apps, SDKs, and shared contracts that ship together.",
}

/**
 * Ecosystem page at /ecosystem.
 *
 * Maps the DeesseJS surface: each sub-domain product, the shared
 * contracts that bind them, and where the platform is heading
 * next. Visitor walks away with a one-page mental model of the
 * ecosystem before diving into any one product.
 *
 * Layout:
 *   ┌─ Hero: title + lead ───────────────────────────┐
 *   ├─ Sub-domain grid (3-cols, 6 sub-domains) ───────┤
 *   ├─ Mantra block: shared defaults + values ────────┤
 *   ├─ Cross-link CTA → /templates, /manifesto ──────┤
 *   └──────────────────────────────────────────────┘
 *
 * Each sub-domain entry uses an initials monogram instead of
 * an icon asset — keeps the page self-contained, no extra
 * image files to ship, and the monograms echo how the
 * sub-domain feels (small, focused).
 */

type SubDomain = {
  slug: string
  url: string
  name: string
  initials: string
  blurb: string
  status: "Shipping" | "In beta" | "Coming soon"
}

const SUB_DOMAINS: ReadonlyArray<SubDomain> = [
  {
    slug: "errors",
    url: "https://errors.deessejs.com",
    name: "Errors",
    initials: "ERR",
    blurb:
      "Structured error tracking — the missing signal in any agent-driven stack.",
    status: "Shipping",
  },
  {
    slug: "drpc",
    url: "https://drpc.deessejs.com",
    name: "DRPC",
    initials: "DRPC",
    blurb:
      "Durable RPC primitives for long-running agent workflows.",
    status: "In beta",
  },
  {
    slug: "collections",
    url: "https://collections.deessejs.com",
    name: "Collections",
    initials: "CL",
    blurb:
      "Type-safe data access for the contracts your templates already publish.",
    status: "Shipping",
  },
  {
    slug: "fp",
    url: "https://fp.deessejs.com",
    name: "FP",
    initials: "FP",
    blurb:
      "Functional primitives the SDK leans on — small, sharp, no runtime cost.",
    status: "Shipping",
  },
  {
    slug: "ui",
    url: "https://ui.deessejs.com",
    name: "UI",
    initials: "UI",
    blurb:
      "Component library on top of shadcn — the DeesseJS look across every surface.",
    status: "Shipping",
  },
  {
    slug: "admin",
    url: "https://admin.deessejs.com",
    name: "Admin",
    initials: "ADM",
    blurb:
      "Operator console for the apps you ship — auth, billing, audit, all reachable.",
    status: "In beta",
  },
  {
    slug: "cloud",
    url: "https://cloud.deessejs.com",
    name: "Cloud",
    initials: "CL",
    blurb:
      "Hosted runtime for the templates — preview, deploy, observe, scale.",
    status: "Coming soon",
  },
] as const

const SHARED_VALUES: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: "One contract, every surface",
    body:
      "Errors, Collections, and FP all speak the same Zod shape. A change in the contract propagates to every consumer on publish — same as the templates.",
  },
  {
    title: "Open source by default",
    body:
      "Every sub-domain ships MIT when it's stable enough. The brand, the marketplace, and the curated registry stay ours — the source-code ecosystem is shared.",
  },
  {
    title: "Smallest useful version first",
    body:
      "Each sub-domain enters the ecosystem in alpha, stays in beta until it earns a production install, and only then opens to third-party contributors.",
  },
] as const

export default function EcosystemPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 py-16 sm:px-6 lg:gap-24 lg:py-24">
      {/* Hero */}
      <header className="flex flex-col gap-6">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          The ecosystem
        </p>
        <H1>The DeesseJS ecosystem.</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-3xl [&:not(:first-child)]:mt-0">
          DeesseJS is more than a templates registry — it&apos;s a
          stack of small apps, SDKs, and shared contracts that ship
          together. Each sub-domain earns its place by solving one
          problem end to end, and they all talk to each other
          through the same contracts.
        </p>
      </header>

      {/* Sub-domain grid */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <H2>Sub-domains</H2>
          <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0 max-w-2xl">
            Click any to open in a new tab — each product lives at
            its own URL, alongside this site.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUB_DOMAINS.map((product) => (
            <a
              key={product.slug}
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <Card className="flex h-full flex-col gap-4 p-6 transition-colors group-hover:bg-accent/30">
                <div className="flex items-start justify-between gap-3">
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-md bg-foreground text-label-13 font-semibold tracking-tight text-background"
                  >
                    {product.initials}
                  </span>
                  <span className="text-label-13 text-muted-foreground/70">
                    {product.status}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                    {product.name}
                  </h3>
                  <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                    {product.blurb}
                  </p>
                </div>
                <code className="text-copy-13-mono text-muted-foreground/70 mt-auto truncate">
                  {product.url.replace("https://", "")}
                </code>
              </Card>
            </a>
          ))}
        </div>
      </section>

      <Separator />

      {/* Shared-values block */}
      <section className="flex flex-col gap-6">
        <H2>What holds it together</H2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {SHARED_VALUES.map((value) => (
            <article
              key={value.title}
              className="flex flex-col gap-2 border-l-2 border-border pl-4"
            >
              <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                {value.title}
              </h3>
              <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                {value.body}
              </p>
            </article>
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
        </div>
      </nav>

      <Separator />

      {/* Action CTA */}
      <nav
        aria-label="Get started"
        className="flex flex-col items-start gap-6"
      >
        <H2>Start here</H2>
        <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0 max-w-xl">
          The fastest way into the ecosystem is a template — it
          pulls the same contract and the same defaults as the
          apps above.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/templates">Browse templates</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/manifesto">Read the manifesto</Link>
          </Button>
        </div>
      </nav>
    </div>
  )
}