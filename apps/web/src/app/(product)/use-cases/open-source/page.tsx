import type { Metadata } from "next"
import { codeToHtml } from "shiki"
import Link from "next/link"
import {
  RelatedUseCases,
  type RelatedUseCaseItem,
} from "../_components/related-use-cases"

import { Section } from "@/app/(marketing)/_components/section"
import { SectionHeader } from "@/app/(marketing)/_components/section-header"
import { UseCaseHero } from "../_components/use-case-page"
import { UseCaseStack } from "../_components/use-case-stack"
import { UseCaseTabs } from "../_components/use-case-tabs"
import { OPEN_SOURCE_SNIPPETS, type OpenSourcePillarSlug } from "../_components/open-source-snippets"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

import { GROUP_1, GROUP_2 } from "./open-source-tabs"

export const metadata: Metadata = {
  title: "Open source | DeesseJS",
  description:
    "Maintainer-friendly starters, MIT-licensed, versioned through the same registry.",
}

/**
 * Standards for the OSS surface — license, public roadmap, public CLI,
 * accepted registry. None of these carry a brand logo, so we render
 * them through <UseCaseStack> (which falls back to a mono-letter chip
 * for unbranded entries) instead of <TechStackGrid> (which expects a
 * /logos/<slug>.svg resolve).
 */
const STACK = [
  "MIT license",
  "Public roadmap",
  "deessejs CLI",
  "Accepted registry",
  "Conventional commits",
  "CHANGELOG.md",
  "AGENTS.md",
  "CODEOWNERS",
] as const

const STEPS = [
  {
    heading: "License and changelog, day one",
    body:
      "MIT license baked into every template. Changelog-driven releases, public roadmap. The boring things that make a project real.",
  },
  {
    heading: "Install with the public CLI",
    body:
      "Users run deessejs init. They do not need to know your internal toolchain. Updates flow back through the same registry.",
  },
  {
    heading: "Community contributions, same shape",
    body:
      "Templates ship with the same AGENTS.md and conventions. A contribution from outside your team lands in the same shape as one from inside.",
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
] as const satisfies ReadonlyArray<RelatedUseCaseItem>

/**
 * First-party templates the org has built on this surface. Pre-launch,
 * so href="#" placeholders. Same 4-card / lg:grid-cols-4 grid as the
 * other migrated pages.
 */
const BUILT_TEMPLATES = [
  { slug: "oss-starter",      title: "oss-starter",      body: "MIT-licensed starter, branded README + CONTRIBUTING." },
  { slug: "changelog-driven", title: "changelog-driven", body: "Conventional commits → CHANGELOG → GitHub release, automated." },
  { slug: "registry-submit",  title: "registry-submit",  body: "PR flow to add a new template to the public registry." },
  { slug: "versioning-rules", title: "versioning-rules", body: "Semver + changesets, enforced at the registry level." },
] as const

export default async function OpenSourcePage() {
  const htmlBySlug: Record<string, { tabName: string; html: string }[]> = {
    "conventional-commits": [], "deessejs-init": [], "agents-md": [], "changeset-release": [],
    "license-check": [], "deessejs-update": [], "codeowners-route": [], "semver-bump": [],
  }

  await Promise.all(
    (Object.keys(OPEN_SOURCE_SNIPPETS) as OpenSourcePillarSlug[]).flatMap((slug) =>
      OPEN_SOURCE_SNIPPETS[slug].files.map((file) =>
        codeToHtml(file.code, {
          lang: file.lang,
          themes: { light: "github-light", dark: "github-dark" },
          defaultColor: false,
        }).then((html) => {
          htmlBySlug[slug]?.push({ tabName: file.tabName, html })
        }),
      ),
    ),
  )

  return (
    <div className="flex flex-col">
      {/* 1. Hero */}
      <UseCaseHero
        category="Open source"
        title="Maintainer-friendly starters, versioned through the registry."
        body="MIT-licensed starters for OSS maintainers. Pin a version, ship your app, never touch the registry again unless you want to."
        primaryCta={{
          label: "Use it yourself",
          href: "/templates",
        }}
        secondaryCta={{
          label: "Talk to delivery",
          href: "/delivery",
        }}
      />

      {/* 2. What's in the box — 4 tabs (maintainer surface). */}
      <Section>
        <SectionHeader
          eyebrow="What's in the box"
          title="The four sub-systems every OSS project needs."
          subtitle="Eight capabilities grouped by the maintainer-side question they answer. Two halves: what ships from day one, and what keeps the project alive for years."
          bordered={true}
        />
        <UseCaseTabs pillars={GROUP_1} htmlBySlug={htmlBySlug} />
      </Section>

      {/* 3. Behind the curtain — 4 tabs (release ops), mirrored. */}
      <Section>
        <SectionHeader
          eyebrow="Behind the curtain"
          title="What keeps an OSS project maintained."
          subtitle="The four sub-systems a maintainer names first. License check, deessejs update, CODEOWNERS routing, semver bump — all on the same registry."
          bordered={true}
        />
        <UseCaseTabs pillars={GROUP_2} htmlBySlug={htmlBySlug} reverse />
      </Section>

      {/* 4. Standards */}
      {/*    Same Section + heading-24 shape as the saas-apps Stack
           section. The content is <UseCaseStack> (not the brand
           wall) because OSS standards are not brand logos: MIT
           license, public roadmap, deessejs CLI, accepted registry. */}
      <Section>
        <div className="flex flex-col divide-y divide-border">
          <div className="px-6 py-6 lg:px-10">
            <p className="text-heading-24 tracking-tighter text-balance [&:not(:first-child)]:mt-0">
              Built with the stack senior engineers ship on.
            </p>
          </div>
          <UseCaseStack items={[...STACK]} />
        </div>
      </Section>

      {/* 5. Process */}
      <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Process
          </p>
          <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            How an OSS project ships.
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

      {/* 6. Built on this */}
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

      {/* 7. Related */}
      <RelatedUseCases items={RELATED} />

      <FinalCta />
    </div>
  )
}
