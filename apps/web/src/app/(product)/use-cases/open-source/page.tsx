import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { UseCaseHero } from "../_components/use-case-page"
import { UseCaseStack } from "../_components/use-case-stack"
import { CopyCommand } from "../_components/copy-command"

export const metadata: Metadata = {
  title: "Open source | DeesseJS",
  description:
    "Maintainer-friendly starters, MIT-licensed, versioned through the same registry.",
}

const STACK = [
  "MIT license",
  "Public roadmap",
  "CHANGELOG-driven releases",
  "Accepted templates registry",
] as const

const STEPS = [
  {
    heading: "License and changelog, day one",
    body: "MIT license baked into every template. Changelog-driven releases, public roadmap. The boring things that make a project real.",
  },
  {
    heading: "Install with the public CLI",
    body: "Users run deessejs init. They do not need to know your internal toolchain. Updates flow back through the same registry.",
  },
  {
    heading: "Community contributions, same shape",
    body: "Templates ship with the same AGENTS.md and conventions. A contribution from outside your team lands in the same shape as one from inside.",
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
    slug: "internal-tools",
    title: "Internal tools",
    tagline:
      "Operator consoles that work behind SSO, on the same auth and contracts as your customer app.",
  },
  {
    slug: "landing-pages",
    title: "Landing pages",
    tagline:
      "High-converting marketing surfaces, tuned for the B2B SaaS shelf.",
  },
] as const

export default function OpenSourcePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="border border-border bg-background rounded-none">
        <UseCaseHero
          category="Open source"
          title="Maintainer-friendly starters, versioned through the registry."
          tagline="MIT-licensed, changelog-driven, accepted through the same registry. Maintainers ship a template. Users install with deessejs init. Updates flow back the same way."
          variant="center"
          primaryCta={{
            label: "Talk to us",
            href: "/contact",
          }}
          secondaryCta={{
            label: "All templates",
            href: "/templates",
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border border-b border-border">
          <div className="lg:col-span-2 flex flex-col gap-3 justify-center p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Standards
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              What ships with every template.
            </h2>
          </div>
          <div className="lg:col-span-4 !p-0 border-0">
            <UseCaseStack items={[...STACK]} />
          </div>
        </div>

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
                  <span className="text-copy-13-mono text-emerald-700 dark:text-emerald-400">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border border-b border-border">
          <div className="lg:col-span-2 flex flex-col gap-4 p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Get started
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Ship a template, accept contributions.
            </h2>
            <CopyCommand command="deessejs init --help" className="mt-2" />
          </div>
          <div className="flex flex-col gap-3 p-6 lg:p-10 bg-emerald-500/5">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Or talk to us
            </p>
            <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
              Maintainer partnership.
            </h3>
            <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
              We help with the boring parts: CI, releases, public roadmap.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-copy-14 text-emerald-700 dark:text-emerald-400 hover:underline underline-offset-4"
            >
              Talk to us
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
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
