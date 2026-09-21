import Link from "next/link"
import type { Metadata } from "next"

import { ArrowRight, Check, CircleAlert, Minus, X } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import { ProCardPricing } from "../_components/pro-card-pricing"
import { PricingCadenceProvider } from "../_components/pricing-cadence-context"
import { PricingHeroTabs } from "../_components/pricing-hero-tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

import { cn } from "@workspace/ui/lib/utils"

import {
  COMPARISON_GROUPS,
  COMPARISON_LAYERS,
  LICENSE_TYPES,
  PRICING_FAQ,
  PRICING_FAQ_GROUPS,
  type ComparisonGroup as ComparisonGroupData,
  type ComparisonStatus,
  type FaqGroup,
  type LicenseType,
  type PricingPrice,
} from "@/lib/pricing"

import { MarketingPage } from "../_components/marketing-page"
import { TechStackGrid } from "../_components/tech-stack-grid"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "How DeesseJS licensing works: per-project one-shot licenses, optional subscription for ongoing updates, MIT for the open community, and custom engagements for enterprise teams.",
}

/**
 * Pricing at /pricing.
 *
 * Renders the license-types model defined in
 * documents/internal/product/pricing.md. All copy lives in
 * @/lib/pricing so the strategy doc stays the single source of truth.
 *
 * Layout — shared-border grid (Vercel-style). Every section lives
 * inside a single wrapper `<div>` that supplies the outer border; each
 * row inside the wrapper divides its cells with `divide-x divide-y
 * divide-border` so cells share borders without double strokes. Sections
 * are separated by `border-b border-border` on the last row of the
 * previous grid (inherited from the wrapper outline).
 *
 * Sections, top to bottom:
 *   1. Hero — single-cell proposition: value angle + tier recap
 *   2. License types — 3 cards (Open Community / Pro / Enterprise)
 *      in a single shared-border grid
 *   3. Trust band — single-row mono statement
 *   4. Built with — TechStackGrid (Next.js, Better Auth, Drizzle, …)
 *   5. Side-by-side comparison — grouped by intent (what you ship,
 *      updates & maintenance, rights & terms including post-cancellation)
 *   6. Who buys what — 2-col grid of 4 personas
 *   7. FAQ — 4 grouped accordions (licensing, post-cancellation, billing, roadmap)
 *   8. Footer CTA — 2-col grid (copy + actions)
 *
 * Pro Education is documented in the FAQ, not as a card or a comparison
 * column, because it shares its templates with Open Community under a
 * different license.
 */
const PERSONAS = [
  {
    label: "Primary",
    title: "Freelance developer or small studio",
    body:
      "Bills the client $20k – $80k. Buys a per-project license to remove the parts of the build that do not pay well: auth setup, billing plumbing, audit logging. Ships under the client brand and may charge the client for the saved time.",
  },
  {
    label: "Secondary",
    title: "In-house team at a startup past the weekend stage",
    body:
      "Buys per-project licenses the same way it buys Vercel or Linear seats. Charges them against engineering time saved. Subscribes for ongoing updates when the team is shipping actively.",
  },
  {
    label: "Tertiary",
    title: "Enterprise team in a regulated industry",
    body:
      "Wants a per-project license not because it cannot build it, but because it does not want to. Adds an engagement contract for procurement, DPAs, and dedicated support.",
  },
  {
    label: "Floor",
    title: "Solo indie hacker shipping a weekend project",
    body:
      "Uses Open Community free templates. The marketing pitch leans on it. No license to manage.",
  },
] as const

const PriceBlock = ({ price }: { price: PricingPrice }) => {
  if (price.kind === "free") {
    return (
      <p className="text-heading-32 tracking-tight text-foreground">Free</p>
    )
  }
  if (price.kind === "custom") {
    return (
      <p className="text-heading-32 tracking-tight text-foreground">
        Custom
        <span className="text-copy-14 ml-2 font-normal text-muted-foreground">
          per engagement
        </span>
      </p>
    )
  }
  if (price.kind === "subscription") {
    const cadence =
      price.cadence === "month" ? "/ month" : "/ year"
    return (
      <p className="text-heading-32 tracking-tight text-foreground">
        ${price.amount}
        <span className="text-copy-14 ml-2 font-normal text-muted-foreground">
          {cadence}, cancel any time
        </span>
      </p>
    )
  }
  return (
    <p className="text-heading-32 tracking-tight text-foreground">
      ${price.amount}
      <span className="text-copy-14 ml-2 font-normal text-muted-foreground">
        one-shot, lifetime
      </span>
    </p>
  )
}

const LICENSE_KICKER: Record<LicenseType["id"], string> = {
  "open-community": "MIT",
  "per-project": "Pro",
  subscription: "Pro",
  enterprise: "Enterprise",
}

/**
 * Tech stack shown in the "Built with" strip. Same set as the home
 * page — Next.js, Better Auth, Drizzle, Stripe, Postgres, Cloudflare,
 * Resend, OpenAI — every provider and runtime wired into the Pro
 * templates out of the box.
 */
const TECH_STACK: ReadonlyArray<{ name: string; logo: string }> = [
  { name: "Next.js", logo: "vercel" },
  { name: "Better Auth", logo: "betterauth" },
  { name: "Drizzle", logo: "drizzle" },
  { name: "Stripe", logo: "stripe" },
  { name: "Postgres", logo: "postgresql" },
  { name: "Cloudflare", logo: "cloudflare" },
  { name: "Resend", logo: "resend" },
  { name: "OpenAI", logo: "openai" },
]

const PricingPage = () => {
  return (
    <MarketingPage>
      <PricingCadenceProvider>
      {/* FAQ JSON-LD. Derived from PRICING_FAQ so the schema and the
          visible Accordion never drift apart. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: PRICING_FAQ.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }),
        }}
      />

      {/* Hero — proposition. One cell, centered, like Infisical's
          hero: a single framed statement with the value angle and
          the tier recap underneath. Anchors the page before the
          tier cards land. */}
      <div className="flex flex-col items-center gap-3 border-b border-border px-6 py-16 text-center sm:py-20 lg:py-24">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Pricing
        </p>
        <h1 className="text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56">
          The catalog your agent can navigate.
        </h1>
        <p className="max-w-2xl text-copy-18 leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
          One payment for the Pro catalog. Every template, every
          update, every project you ship. MIT for the floor, Pro for
          production, custom for enterprise.
        </p>
      </div>

      {/* Cadence toggle — 16px tall strip flush against the license
          cards below. The tabs (lifetime vs subscription) live here
          rather than in the hero so they read as the lever that
          drives the cards beneath. */}
      <div className="flex h-12 items-center justify-center border-b border-border">
        <PricingHeroTabs />
      </div>

      {/* 2. License types — 3 cards on md+. Only the non-banner
            license types render in the grid; the Subscription is
            rendered as a horizontal banner immediately below.
            Borders are owned by the cells (border-r/border-t) so the
            Pro card's ring doesn't double up on the shared divider. */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border md:divide-y-0">
          {LICENSE_TYPES.filter((l) => !l.banner).map((license, index, arr) => (
            <LicenseCell
              key={license.id}
              license={license}
              isLast={index === arr.length - 1}
            />
          ))}
        </div>

        {/* 4. Built with — same vertical pattern as the homepage:
            title row on top, TechStackGrid row below. The pricing
            page surfaces the same providers so a visitor can see
            exactly what the Pro templates ship wired in. */}
        <div className="grid grid-cols-1 divide-y divide-border border-b border-border">
          <div className="px-8 py-6">
            <p className="text-heading-24 tracking-tighter text-balance [&:not(:first-child)]:mt-0">
              Built with the stack senior engineers ship on.
            </p>
          </div>
          <TechStackGrid techs={TECH_STACK} />
        </div>

        {/* 5. Side-by-side comparison — grouped by intent */}
        <div className="border-b border-border">
          <Cell className="!p-0 border-0">
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">
                Side by side
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                The deep dive. Anyone comparing two license types should
                not have to read three cards.
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-copy-14">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-1/4 py-3 pr-4 font-semibold text-foreground">
                      Attribute
                    </th>
                    {COMPARISON_LAYERS.map((layer) => (
                      <th
                        key={layer.id}
                        className="w-1/4 py-3 pr-4 font-semibold text-foreground"
                      >
                        {layer.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_GROUPS.map((group) => (
                    <ComparisonGroup key={group.heading} group={group} />
                  ))}
                </tbody>
              </table>
            </div>
          </Cell>
        </div>

        {/* 6. Who buys what — 2-col grid of 4 personas */}
        <div className="border-b border-border">
          <Cell className="!p-0 border-0">
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">
                Who buys what
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                The four buyers we built the licensing model around. Find
                the one closest to you.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-y-0">
              {PERSONAS.map((persona, index) => (
                <div
                  key={persona.label}
                  className={cn(
                    "group border-border transition-colors hover:bg-accent/40",
                    // Vertical separator on every card except the first
                    // in each row (md+ uses 2 cols, so col 2 = index 1
                    // and index 3).
                    "border-b last:border-b-0 md:border-b-0",
                    // Every odd-indexed card sits in the right column
                    // and gets a left border on md+.
                    index % 2 === 1 && "md:border-l"
                  )}
                >
                  <Cell className="gap-3">
                    <span className="text-label-13 font-mono text-muted-foreground">
                      {persona.label}
                    </span>
                    <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                      {persona.title}
                    </h3>
                    <p className="text-copy-14 text-muted-foreground leading-7 line-clamp-4 [&:not(:first-child)]:mt-0">
                      {persona.body}
                    </p>
                  </Cell>
                </div>
              ))}
            </div>
          </Cell>
        </div>


        {/* 7. FAQ — 4 grouped accordions */}
        <div className="border-b border-border">
          <Cell className="!p-0 border-0">
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">
                Frequently asked
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                Grouped by topic. Skip to what you need.
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              {PRICING_FAQ_GROUPS.map((group) => (
                <FaqCell key={group.heading} group={group} />
              ))}
            </div>
          </Cell>
        </div>

        {/* 8. Footer CTA — 2-col grid (copy + actions) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
          <Cell className="gap-2 lg:!p-10">
            <p className="text-label-13 text-muted-foreground">
              Ready to ship?
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-foreground text-balance [&:not(:first-child)]:mt-0">
              Start with a template. Keep the contracts.
            </h2>
            <p className="text-copy-16 text-muted-foreground leading-7 max-w-xl [&:not(:first-child)]:mt-0">
              Install the CLI, pick a starter, and your agent gets every
              contract it needs to navigate the rest of the project.
            </p>
          </Cell>
          <Cell className="items-stretch justify-center gap-4 lg:!p-10">
            <Button asChild size="lg">
              <Link href="/knowledge-base/guides/install-deessejs-cli">
                Install the CLI
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/templates">Browse the registry</Link>
            </Button>
          </Cell>
        </div>
      </PricingCadenceProvider>
    </MarketingPage>
  )
}

export default PricingPage

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Horizontal banner for the optional Subscription license type.
 * Renders full-width inside the Recipe A wrapper, between the three
 * license-type cards and the trust band. Layout: 2-col on md+ with
 * copy on the left and price + CTA on the right; stacked on <sm.
 */
/** Generic shared-border cell. The wrapper card supplies the outer
 *  borders; cells contribute only their own padding + optional flex
 *  layout. */
function Cell({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn("flex flex-col p-6", className)}>{children}</div>
}

function LicenseCell({
  license,
  isLast = false,
}: {
  license: LicenseType
  isLast?: boolean
}) {
  const isRecommended = license.recommended === true
  return (
    <div
      className={cn(
        "group relative border-border transition-colors hover:bg-accent/40",
        // Vertical separators on md+: every cell gets a right border
        // except the last one. This replaces the grid's divide-x so
        // Pro's ring doesn't double up on the divider.
        "border-b last:border-b-0 md:border-b-0 md:border-r",
        isLast && "md:border-r-0",
        isRecommended &&
          "bg-background md:-my-px md:border md:border-border md:shadow-[0_8px_24px_-12px_rgb(0_0_0_/0.15)]"
      )}
    >
      <Cell className="gap-5 h-full">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-label-13 text-muted-foreground">
              {LICENSE_KICKER[license.id]}
            </span>
            {isRecommended ? (
              <Badge variant="success" className="text-label-12 gap-1.5">
                <span
                  aria-hidden
                  className="size-1.5 rounded-full bg-emerald-500"
                />
                Recommended
              </Badge>
            ) : null}
          </div>
          <h3 className="text-heading-24 tracking-tight text-foreground !m-0">
            {license.name}
          </h3>
          <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
            {license.tagline}
          </p>
        </header>

        {isRecommended ? (
          <ProCardPricing license={license} />
        ) : (
          <>
            <PriceBlock price={license.price} />

            <p className="text-copy-14 text-foreground/90 [&:not(:first-child)]:mt-0">
              {license.forWho}
            </p>

            <p className="text-copy-14 text-foreground/90 [&:not(:first-child)]:mt-0">
              {license.positioning}
            </p>

            <ul className="flex flex-col gap-2 text-copy-14 text-muted-foreground">
              {license.ships.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden="true" className="select-none">
                    •
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-2">
              {license.cta.external ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  <a href={license.cta.href}>{license.cta.label}</a>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  <Link href={license.cta.href}>{license.cta.label}</Link>
                </Button>
              )}
            </div>
          </>
        )}
      </Cell>
    </div>
  )
}

function ComparisonGroup({ group }: { group: ComparisonGroupData }) {
  return (
    <>
      <tr className="border-b border-border/60 bg-muted/30">
        <th
          scope="colgroup"
          colSpan={1 + COMPARISON_LAYERS.length}
          className="py-2 pr-4 pl-6 text-left text-label-13 uppercase tracking-wider text-muted-foreground"
        >
          {group.heading}
        </th>
      </tr>
      {group.rows.map((row) => (
        <tr key={row.attribute} className="border-b border-border/60">
          <th
            scope="row"
            className="py-3 pr-4 pl-6 text-left align-top font-medium text-foreground"
          >
            {row.tooltip ? (
              <AttributeTooltip
                content={row.tooltip}
                id={`attr-${row.attribute.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                {row.attribute}
              </AttributeTooltip>
            ) : (
              row.attribute
            )}
          </th>
          {COMPARISON_LAYERS.map((layer) => {
            const status = row.status?.[layer.id] ?? "yes"
            const isPerProject = layer.id === "per-project"
            return (
              <td
                key={`${row.attribute}-${layer.id}`}
                className={cn(
                  "py-3 px-4 align-top text-muted-foreground",
                  // Subtle highlight on the Per-project column to make
                  // it the visual anchor when comparing.
                  isPerProject && "bg-muted/30"
                )}
              >
                <span className="flex items-start gap-2">
                  <ComparisonStatusIcon status={status} />
                  <span>{row.values[layer.id]}</span>
                </span>
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}

/** Status icon for a comparison cell. yes = green check, partial =
 *  amber alert, no = rose x, na = muted dash. */
function ComparisonStatusIcon({ status }: { status: ComparisonStatus }) {
  if (status === "yes") {
    return (
      <Check
        aria-hidden
        className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
      />
    )
  }
  if (status === "partial") {
    return (
      <CircleAlert
        aria-hidden
        className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
      />
    )
  }
  if (status === "no") {
    return (
      <X
        aria-hidden
        className="mt-0.5 size-3.5 shrink-0 text-rose-600 dark:text-rose-400"
      />
    )
  }
  return (
    <Minus
      aria-hidden
      className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60"
    />
  )
}

/** CSS-only tooltip on a comparison row attribute. Renders an underline
 *  dotted on the wrapped text and reveals the explanation on hover or
 *  keyboard focus. No JS, no portal — works in pure SSR HTML. */
function AttributeTooltip({
  content,
  id,
  children,
}: {
  content: string
  id: string
  children: React.ReactNode
}) {
  return (
    <span className="group/attr relative inline-block">
      <Button
        asChild
        variant="ghost"
        size="sm"
        aria-describedby={id}
        className="h-auto cursor-help rounded-none border-b border-dotted border-muted-foreground/60 bg-transparent p-0 text-inherit transition-colors hover:bg-transparent hover:border-foreground focus-visible:bg-transparent focus-visible:border-foreground focus-visible:ring-0"
      >
        <span>{children}</span>
      </Button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-max max-w-[280px] rounded-md bg-foreground px-3 py-1.5 text-xs leading-relaxed text-balance text-background opacity-0 shadow-lg transition-opacity group-hover/attr:opacity-100 group-focus-within/attr:opacity-100"
      >
        {content}
      </span>
    </span>
  )
}

function FaqCell({ group }: { group: FaqGroup }) {
  return (
    <Cell className="gap-4">
      <h3 className="text-label-13 uppercase tracking-wider text-muted-foreground">
        {group.heading}
      </h3>
      <Accordion type="single" collapsible className="w-full">
        {group.items.map((item, index) => (
          <AccordionItem
            key={item.question}
            value={`${group.heading}-${index}`}
          >
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>
              <p className="text-copy-14 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
                {item.answer}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Cell>
  )
}
