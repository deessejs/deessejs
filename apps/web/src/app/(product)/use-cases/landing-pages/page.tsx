import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { UseCaseHero } from "../_components/use-case-page"
import { CopyCommand } from "../_components/copy-command"
import { resolveCapabilities } from "../_data"

export const metadata: Metadata = {
  title: "Landing pages | DeesseJS",
  description:
    "High-converting marketing surfaces, tuned for the B2B SaaS shelf.",
}

type AnatomyBlock = {
  name: string
  purpose: string
  why: string
}

const ANATOMY: ReadonlyArray<AnatomyBlock> = [
  {
    name: "Hero",
    purpose: "Earn the click in 5 seconds.",
    why: "Specific promise + dual CTA + install hint. No stock imagery, no carousel.",
  },
  {
    name: "Surface grid",
    purpose: "Show what the registry covers, not what the product is.",
    why: "Surfaces over templates: SaaS, AI, mobile, desktop, CLIs, APIs, blogs, e-commerce.",
  },
  {
    name: "Process section",
    purpose: "Move the visitor from interest to commitment.",
    why: "Numbered steps the visitor can mentally complete in one read.",
  },
  {
    name: "Authority trio",
    purpose: "Earn trust without testimonials.",
    why: "Manifesto + KB docs + public changelog. Evidence that the team ships.",
  },
  {
    name: "Pricing FAQ",
    purpose: "Pre-empt the objections that close the deal.",
    why: "Six questions, real answers. No contact form to unlock the answers.",
  },
  {
    name: "Final CTA",
    purpose: "Two doors, not one.",
    why: "Self-service + delivery. Different buyers, same page.",
  },
]

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
    slug: "internal-tools",
    title: "Internal tools",
    tagline:
      "Operator consoles that work behind SSO, on the same auth and contracts as your customer app.",
  },
] as const

export default function LandingPagesPage() {
  const capabilities = resolveCapabilities("landing-pages")
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="flex flex-col gap-12">
        <UseCaseHero
          category="Marketing"
          title="A landing page that earns the click."
          status="coming-soon"
          primaryCta={{
            label: "View landing-page",
            href: "/templates/landing-page",
          }}
          capabilities={capabilities}
        />

        {/* Self-referential callout */}
        <div className="overflow-hidden rounded-lg border border-amber-500/30 bg-amber-500/5">
          <div className="flex flex-col gap-3 p-6 sm:p-8 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-amber-700 dark:text-amber-400">
              You are here
            </p>
            <h2 className="max-w-3xl text-heading-24 font-medium tracking-tight text-balance lg:text-heading-32">
              This page is one example of the landing-page template.
            </h2>
            <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground">
              Same hero, same surface grid, same FAQ pattern, same two-door CTA.
              What changes is the copy and the visuals. What does not change is
              the conversion-tested structure underneath.
            </p>
          </div>
        </div>

        {/* Anatomy breakdown */}
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-3 border-b border-border p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Anatomy
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              What ships in the template.
            </h2>
            <p className="max-w-2xl text-copy-16 leading-7 text-muted-foreground">
              Six blocks, each with a job. Add or remove as your story needs.
            </p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-3 lg:!divide-x-0">
            {ANATOMY.map((block, idx) => (
              <AnatomyCard key={block.name} block={block} idx={idx} />
            ))}
          </div>
        </div>

        {/* Lighthouse */}
        <div className="overflow-hidden rounded-lg border border-amber-500/30 bg-amber-500/5">
          <div className="grid grid-cols-1 divide-y divide-amber-500/20 md:grid-cols-3 md:divide-x md:divide-y-0">
            <LighthouseStat value="100" label="Lighthouse score" sub="Performance, accessibility, best practices, SEO." />
            <LighthouseStat value="0" label="JS by default" sub="Static output. Hydrate only what you need." />
            <LighthouseStat value="<50ms" label="TTFB on Vercel" sub="Edge-cached HTML. No server round-trip per page." />
          </div>
        </div>

        {/* CTA */}
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-4 p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Get started
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              The page you&apos;re reading, shipped.
            </h2>
            <CopyCommand command="deessejs init landing-page" className="mt-2" />
            <p className="font-mono text-copy-13 text-muted-foreground">
              or run{" "}
              <span className="text-foreground/90">deessejs init --help</span> for the
              full list.
            </p>
          </div>
        </div>

        {/* Related */}
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-3 border-b border-border p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Explore
            </p>
            <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              Related use cases.
            </h2>
          </div>
          <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
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
      </div>
    </div>
  )
}

function AnatomyCard({
  block,
  idx,
}: {
  block: AnatomyBlock
  idx: number
}) {
  return (
    <div className="flex flex-col gap-3 p-6 lg:p-8">
      <div className="flex items-center gap-2">
        <span className="font-mono text-copy-13 text-amber-700 dark:text-amber-400">
          {String(idx + 1).padStart(2, "0")}
        </span>
        <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
          {block.name}
        </h3>
      </div>
      <p className="text-copy-14 leading-6 text-foreground">
        {block.purpose}
      </p>
      <p className="text-copy-13 leading-5 text-muted-foreground">
        {block.why}
      </p>
    </div>
  )
}

function LighthouseStat({
  value,
  label,
  sub,
}: {
  value: string
  label: string
  sub: string
}) {
  return (
    <div className="flex flex-col gap-2 p-6 lg:p-8">
      <span className="text-heading-40 font-medium tracking-tight text-amber-700 lg:text-heading-56 dark:text-amber-400">
        {value}
      </span>
      <p className="font-medium text-copy-14 text-foreground">
        {label}
      </p>
      <p className="text-copy-13 leading-5 text-muted-foreground">
        {sub}
      </p>
    </div>
  )
}
