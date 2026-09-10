import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { UseCaseHero } from "../_components/use-case-page"
import { UseCaseStack } from "../_components/use-case-stack"
import { CopyCommand } from "../_components/copy-command"

export const metadata: Metadata = {
  title: "Landing pages | DeesseJS",
  description:
    "High-converting marketing surfaces, tuned for the B2B SaaS shelf.",
}

const STACK = ["Astro", "Tailwind", "shadcn blocks"] as const

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

const STEPS = [
  {
    heading: "Start from the shell",
    body: "Astro + Tailwind + shadcn blocks wired for B2B conversion. The conversion primitives are already in place.",
  },
  {
    heading: "Swap the copy and the visuals",
    body: "The structure stays. Your words, your screenshots, your colors.",
  },
  {
    heading: "Ship the page, not the framework",
    body: "Static output, fast on every device. Lighthouse-ready by default.",
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
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="border border-border bg-background rounded-none">
        {/* 1. Hero — self-referential */}
        <UseCaseHero
          category="Marketing"
          title="A landing page that earns the click."
          tagline="You're reading one example of the template right now. The same conversion primitives ship in every landing-page project from the registry."
          variant="self-referential"
          status="coming-soon"
          primaryCta={{
            label: "View landing-page",
            href: "/templates/landing-page",
          }}
          secondaryCta={{
            label: "Talk to delivery",
            href: "/contact",
          }}
        />

        {/* 2. Self-referential callout */}
        <div className="border-b border-border bg-amber-500/5">
          <div className="px-6 py-12 sm:px-8">
            <p className="text-label-13 uppercase tracking-wider text-amber-700 dark:text-amber-400">
              You are here
            </p>
            <h2 className="mt-2 text-heading-24 lg:text-heading-32 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              This page is one example of the landing-page template.
            </h2>
            <p className="mt-3 text-copy-16 text-muted-foreground leading-7 max-w-3xl [&:not(:first-child)]:mt-0">
              Same hero, same surface grid, same FAQ pattern, same two-door CTA.
              What changes is the copy and the visuals. What does not change is
              the conversion-tested structure underneath.
            </p>
          </div>
        </div>

        {/* 3. Anatomy breakdown */}
        <div className="border-b border-border">
          <div className="grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
            <div className="lg:col-span-2 flex flex-col gap-3 justify-center p-6 lg:p-10 bg-amber-500/5">
              <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
                Anatomy
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
                What ships in the template.
              </h2>
              <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                Six blocks, each with a job. Add or remove as your story needs.
              </p>
            </div>
            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border !p-0 border-0">
              {ANATOMY.map((block, idx) => (
                <AnatomyCard key={block.name} block={block} idx={idx} />
              ))}
            </div>
          </div>
        </div>

        {/* 4. Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border border-b border-border">
          <div className="lg:col-span-2 flex flex-col gap-3 justify-center p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Stack
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Astro + Tailwind + shadcn blocks.
            </h2>
          </div>
          <div className="lg:col-span-4 !p-0 border-0">
            <UseCaseStack items={[...STACK]} />
          </div>
        </div>

        {/* 5. Process */}
        <div className="border-b border-border">
          <div className="grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
            <div className="lg:col-span-2 flex flex-col gap-3 justify-center p-6 lg:p-10">
              <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
                Process
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
                What shipping looks like.
              </h2>
            </div>
            <ol className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border !p-0 border-0">
              {STEPS.map((step, idx) => (
                <li
                  key={step.heading}
                  className="flex flex-col gap-3 p-6 lg:p-8"
                >
                  <span className="text-copy-13-mono text-amber-700 dark:text-amber-400">
                    Step {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
                    {step.heading}
                  </h3>
                  <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* 6. Lighthouse */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border bg-amber-500/5">
          <LighthouseStat value="100" label="Lighthouse score" sub="Performance, accessibility, best practices, SEO." />
          <LighthouseStat value="0" label="JS by default" sub="Static output. Hydrate only what you need." />
          <LighthouseStat value="<50ms" label="TTFB on Vercel" sub="Edge-cached HTML. No server round-trip per page." />
        </div>

        {/* 7. CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
          <div className="lg:col-span-2 flex flex-col gap-4 p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Get started
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              The page you're reading, shipped.
            </h2>
            <CopyCommand command="deessejs init landing-page" className="mt-2" />
            <p className="text-copy-13-mono text-muted-foreground [&:not(:first-child)]:mt-0">
              or run{" "}
              <span className="text-foreground/90">deessejs init --help</span> for the
              full list.
            </p>
          </div>
          <div className="flex flex-col gap-3 p-6 lg:p-10 bg-amber-500/5">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Or ship with us
            </p>
            <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
              We write the copy that converts.
            </h3>
            <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
              Same template, words that earn the click.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-copy-14 text-amber-700 dark:text-amber-400 hover:underline underline-offset-4"
            >
              Talk to delivery
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>

        {/* 8. Related */}
        <div className="border-t border-border grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
          <div className="lg:col-span-2 flex flex-col gap-3 justify-center p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Explore
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Related use cases.
            </h2>
          </div>
          <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border !p-0 border-0">
            {RELATED.map((item) => (
              <Link
                key={item.slug}
                href={`/use-cases/${item.slug}`}
                className="group flex flex-col gap-2 p-6 lg:p-8 transition-colors hover:bg-accent/40"
              >
                <p className="text-label-13 text-muted-foreground">Related</p>
                <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
                  {item.title}
                </h3>
                <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0 line-clamp-3">
                  {item.tagline}
                </p>
                <p className="text-label-13 text-foreground inline-flex items-center gap-1 pt-1">
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
        <span className="text-copy-13-mono text-amber-700 dark:text-amber-400">
          {String(idx + 1).padStart(2, "0")}
        </span>
        <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
          {block.name}
        </h3>
      </div>
      <p className="text-copy-14 text-foreground leading-6 [&:not(:first-child)]:mt-0">
        {block.purpose}
      </p>
      <p className="text-copy-13 text-muted-foreground leading-5 [&:not(:first-child)]:mt-0">
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
      <span className="text-heading-40 lg:text-heading-56 font-medium tracking-tight text-amber-700 dark:text-amber-400 [&:not(:first-child)]:mt-0">
        {value}
      </span>
      <p className="text-copy-14 font-medium text-foreground [&:not(:first-child)]:mt-0">
        {label}
      </p>
      <p className="text-copy-13 text-muted-foreground leading-5 [&:not(:first-child)]:mt-0">
        {sub}
      </p>
    </div>
  )
}
