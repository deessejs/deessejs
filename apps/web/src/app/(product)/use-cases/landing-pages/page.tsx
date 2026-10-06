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
import { TechStackGrid } from "@/app/(marketing)/_components/tech-stack-grid"
import { UseCaseTabs } from "../_components/use-case-tabs"
import { LANDING_PAGES_SNIPPETS, type LandingPagesPillarSlug } from "../_components/landing-pages-snippets"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

import { GROUP_1, GROUP_2 } from "./landing-pages-tabs"

export const metadata: Metadata = {
  title: "Landing pages | DeesseJS",
  description:
    "High-converting marketing surfaces, tuned for the B2B SaaS shelf.",
}

const STACK = [
  { name: "Astro",         logo: "astro" },
  { name: "Tailwind",      logo: "tailwindcss" },
  { name: "shadcn blocks", logo: "shadcnui" },
  { name: "MDX",           logo: "shadcnui" },
  { name: "RSS",           logo: "shadcnui" },
  { name: "Sitemap",       logo: "shadcnui" },
  { name: "Open Graph",    logo: "shadcnui" },
  { name: "Analytics",     logo: "cloudflare" },
] as const

const STEPS = [
  {
    heading: "Scaffold the page",
    body:
      "The landing template ships with the same hero, surface grid, process, and FAQ recipe that ships on the marketing site you're reading.",
  },
  {
    heading: "Drop in your content",
    body:
      "Replace the placeholder copy with your product, your surfaces, your social proof. The conversion-tested structure stays.",
  },
  {
    heading: "Ship and measure",
    body:
      "Lighthouse score ships green by default. Static output, no hydration cost on the parts you don't need.",
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
      "Admin dashboards and operator consoles that work behind SSO.",
  },
] as const satisfies ReadonlyArray<RelatedUseCaseItem>

const BUILT_TEMPLATES = [
  { slug: "landing-page",     title: "landing-page",     body: "Marketing-ready hero, surfaces, FAQ, two-door CTA." },
  { slug: "pricing-template", title: "pricing-template", body: "Tier matrix + plan comparison + signup CTA." },
  { slug: "blog-template",   title: "blog-template",    body: "MDX + taxonomy + author pages, ready to ship." },
  { slug: "changelog",        title: "changelog",        body: "Tagged entries + author credits + RSS feed." },
] as const

export default async function LandingPagesPage() {
  const htmlBySlug: Record<string, { tabName: string; html: string }[]> = {
    "hero-block": [], "surface-grid": [], "authority-block": [], "process-cta": [],
    "headline-spec": [], "tabbed-explorer": [], "kb-link": [], "numbered-steps": [],
  }

  await Promise.all(
    (Object.keys(LANDING_PAGES_SNIPPETS) as LandingPagesPillarSlug[]).flatMap((slug) =>
      LANDING_PAGES_SNIPPETS[slug].files.map((file) =>
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
        category="Marketing"
        title="A landing page that earns the click."
        body="Marketing surfaces that match the production code: same primitives, same tokens, no drift between Figma and prod. The four structural blocks a B2B landing page needs are wired into the template before your first commit."
        primaryCta={{
          label: "Use it yourself",
          href: "/templates",
        }}
        secondaryCta={{
          label: "Talk to delivery",
          href: "/delivery",
        }}
      />

      {/* 2. What's in the box — 4 tabs (structural blocks). */}
      <Section>
        <SectionHeader
          eyebrow="What's in the box"
          title="The four structural blocks every landing page needs."
          subtitle="The same blocks the marketing site you are reading ships with. Add or remove as your story needs."
          bordered={true}
        />
        <UseCaseTabs pillars={GROUP_1} htmlBySlug={htmlBySlug} />
      </Section>

      {/* 3. Behind the curtain — 4 tabs (primitives), mirrored. */}
      <Section>
        <SectionHeader
          eyebrow="Behind the curtain"
          title="What keeps a landing page converting."
          subtitle="The four primitives the template ships with. Headline spec, tabbed explorer, KB link, numbered steps — all the building blocks a buyer can drop into their own page."
          bordered={true}
        />
        <UseCaseTabs pillars={GROUP_2} htmlBySlug={htmlBySlug} reverse />
      </Section>

      {/* 4. Stack */}
      {/*    Same TechStackGrid + same Section shape as the saas-apps
           page (and the homepage + /pricing page). Header row on top,
           brand wall underneath. The brand tiles rotate on a swap
           animation, so the surface reads as a living tech stack
           rather than a static logo dump. */}
      <Section>
        <div className="flex flex-col divide-y divide-border">
          <div className="px-6 py-6 lg:px-10">
            <p className="text-heading-24 tracking-tighter text-balance [&:not(:first-child)]:mt-0">
              Built with the stack senior engineers ship on.
            </p>
          </div>
          <TechStackGrid techs={STACK} />
        </div>
      </Section>

      {/* 5. Process */}
      <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Process
          </p>
          <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            How a landing page ships.
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
            Production-ready starter templates, each deployed at its
            own URL. Used as the reference set for what the registry
            can ship.
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
