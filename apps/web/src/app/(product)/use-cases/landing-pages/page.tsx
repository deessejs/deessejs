import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { UseCaseHero } from "../_components/use-case-page"
import { TechStackGrid } from "@/app/(marketing)/_components/tech-stack-grid"
import { CapabilityClustersSection } from "../_components/capability-cluster"
import { FinalCta } from "@/components/pages/use-cases/final-cta"

export const metadata: Metadata = {
  title: "Landing pages | DeesseJS",
  description:
    "High-converting marketing surfaces, tuned for the B2B SaaS shelf.",
}

/**
 * Stack specific to the landing-page surface. Same shape as the
 * other use-case pages so the brand display stays uniform.
 */
const STACK = [
  { name: "Astro",   logo: "astro" },
  { name: "Tailwind", logo: "tailwindcss" },
  { name: "shadcn blocks", logo: "shadcnui" },
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
] as const

const BUILT_TEMPLATES = [
  { slug: "landing-page",     title: "landing-page",     body: "Marketing-ready hero, surfaces, FAQ, two-door CTA." },
  { slug: "pricing-template", title: "pricing-template", body: "Tier matrix + plan comparison + signup CTA." },
  { slug: "blog-template",   title: "blog-template",    body: "MDX + taxonomy + author pages, ready to ship." },
  { slug: "changelog",        title: "changelog",        body: "Tagged entries + author credits + RSS feed." },
] as const

/**
 * The landing-page use-case is auto-referential: every block on
 * the marketing site is also a block the buyer can drop into
 * their own page. The four clusters below mirror the four
 * structural pieces the DeesseJS marketing uses itself.
 */
const CAPABILITY_CLUSTERS = [
  {
    id: "hero-and-promise",
    iconName: "Sparkles",
    title: "Hero & promise",
    lead:
      "The first 50px above the fold. Earn the click in five seconds or lose the visitor for the day.",
    rows: [
      {
        id: "headline-subline",
        title: "Headline + sub-line",
        body:
          "The hero carries one declarative promise, one sentence of context, and one primary CTA. Eyebrow + lead + dual CTA is the recipe. No carousel, no stock imagery, no slider.",
      },
      {
        id: "specificity",
        title: "Specificity beats superlatives",
        body:
          "Concrete promises outperform adjectives. 'Ship a B2B SaaS with auth, billing, and a working dashboard on day one' outperforms 'the best platform for your business needs'.",
      },
      {
        id: "dual-cta",
        title: "Two doors, one hero",
        body:
          "Self-serve + engagement, side by side. Different buyers, same page. Both visible above the fold; the page never forces a single funnel.",
      },
    ],
  },
  {
    id: "surface-grid",
    iconName: "Layers",
    title: "Surface grid",
    lead:
      "Show what the registry covers, not what the product is. Surfaces over templates: SaaS, AI, mobile, desktop, CLIs, APIs, blogs, e-commerce.",
    rows: [
      {
        id: "surface-tiles",
        title: "Surface tiles, not product tour",
        body:
          "The grid lists categories of work the visitor can ship with the registry. Eight tiles in two rows reads as a portfolio, not a feature dump.",
      },
      {
        id: "tabbed-explorer",
        title: "Tabbed deep-dive",
        body:
          "Selecting a tile reveals what the registry ships for that surface — a few paragraphs of selling copy, a working mockup, an install hint. The same tabbed pattern on the homepage.",
      },
      {
        id: "self-referential",
        title: "Self-referential surfaces",
        body:
          "Each surface tile points at a use-case page that documents the surface in detail. The landing page IS the registry's overview — clicking a tile never leaves the marketing site.",
      },
    ],
  },
  {
    id: "authority",
    iconName: "ShieldCheck",
    title: "Authority",
    lead:
      "Earn trust without testimonials. Manifesto + KB docs + public changelog. Evidence that the team ships, on the same domain.",
    rows: [
      {
        id: "manifesto",
        title: "Manifesto link",
        body:
          "The page points at a manifesto that explains why the work exists. Buyers read the manifesto before they read the pricing; the manifesto carries the conviction the rest of the page inherits.",
      },
      {
        id: "docs-link",
        title: "Knowledge base link",
        body:
          "A live docs surface, not a screenshot of one. The KB articles the visitor can search are the same articles they will live with after they buy.",
      },
      {
        id: "changelog-link",
        title: "Public changelog",
        body:
          "A versioned changelog is the receipt that the team ships. The presence of one is more convincing than any testimonial.",
      },
    ],
  },
  {
    id: "process-and-cta",
    iconName: "Workflow",
    title: "Process & CTA",
    lead:
      "From interest to commitment. Numbered steps the visitor can mentally complete in one read, then a final CTA that asks for the close.",
    rows: [
      {
        id: "numbered-steps",
        title: "Numbered steps, not marketing prose",
        body:
          "Three to five steps the visitor can rephrase back to a colleague. The numbered cadence reads as 'this is how shipping works' rather than 'this is what we want you to believe'.",
      },
      {
        id: "stack-block",
        title: "Stack block",
        body:
          "The names of the technologies the page ships with — Next.js, Better Auth, Drizzle, Stripe, Resend. Senior visitors scan the stack before they read the copy.",
      },
      {
        id: "two-door-cta",
        title: "Two-door CTA",
        body:
          "Self-serve side by side with engagement. No single funnel forced on every visitor; no contact form the visitor must fill to see pricing.",
      },
    ],
  },
] as const

/**
 * No mockups for the landing-page use case. The clusters ARE
 * the surface the buyer is shipping, so a mocked-up version of
 * the marketing site reading itself would be noise. The right
 * column renders a quiet preview panel for every cluster.
 */
const CLUSTER_MOCKUPS = {
  "hero-and-promise": undefined,
  "surface-grid":      undefined,
  authority:           undefined,
  "process-and-cta":   undefined,
} as const

export default function LandingPagesPage() {
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

      {/* 2. What's in the box — self-referential structure */}
      <section className="border-b border-border">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-10 lg:px-10 lg:py-12">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            What&apos;s in the box
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            The four structural blocks every landing page needs.
          </h2>
          <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            The same blocks the marketing site you are reading
            ships with. Add or remove as your story needs.
          </p>
        </div>
        <CapabilityClustersSection
          clusters={CAPABILITY_CLUSTERS}
          mockups={CLUSTER_MOCKUPS}
        />
      </section>

      {/* 3. Stack */}
      <section className="flex flex-col border-t border-border">
        <div className="flex flex-col gap-3 px-6 py-10 lg:px-10 lg:py-12 border-b border-border">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Stack
          </p>
          <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            What runs on day one.
          </h2>
        </div>
        <TechStackGrid techs={STACK} />
      </section>

      {/* 4. Process */}
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

      {/* 5. Built on this */}
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

      {/* 6. Related */}
      <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Explore
          </p>
          <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            Related use cases.
          </h2>
        </div>
        <div className="grid grid-cols-1 divide-y divide-border lg:col-span-4 !p-0 border-0 md:grid-cols-3 md:divide-x md:divide-y-0">
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

      <FinalCta />
    </div>
  )
}
