import Link from "next/link"
import type { Metadata } from "next"

import { ArrowRight } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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
  type FaqGroup,
  type LicenseType,
  type PricingPrice,
} from "@/lib/pricing"

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
 *   1. License types — 3 cards (Open Community / Pro / Enterprise)
 *      in a single shared-border grid
 *   2. Subscription banner — horizontal card below the three cards.
 *      Same Pro catalog, paid monthly instead of one-shot. The cadence
 *      choice is the only difference vs the Pro card above.
 *   3. Trust band — single-row mono statement
 *   4. Side-by-side comparison — grouped by intent (what you ship,
 *      updates & maintenance, rights & terms including post-cancellation)
 *   5. Who buys what — 2-col grid of 4 personas
 *   6. How Pro licensing works — full-width prose
 *   7. What happens when you cancel — full-width prose
 *   8. FAQ — 4 grouped accordions (licensing, post-cancellation, billing, roadmap)
 *   9. Footer CTA — 2-col grid (copy + actions)
 *
 * Pro Education is documented in the How per-project licensing section
 * and in the FAQ, not as a card or a comparison column, because it shares
 * its templates with Open Community under a different license.
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

const PricingPage = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
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

      {/* Shared-border wrapper — every section lives inside one card */}
      <div className="border border-border bg-background rounded-none">
        {/* 1. License types — 3 cards on md+. Only the non-banner
            license types render in the grid; the Subscription is
            rendered as a horizontal banner immediately below. */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          {LICENSE_TYPES.filter((l) => !l.banner).map((license) => (
            <LicenseCell key={license.id} license={license} />
          ))}
        </div>

        {/* 2. Subscription banner — horizontal card spanning the
            full wrapper width. Sits between the three cards and the
            trust band so it reads as the natural next step after
            picking a license type. */}
        <SubscriptionBanner />

        {/* 3. Trust band — single-row statement */}
        <Cell className="items-center text-center border-b border-border !py-4 bg-muted/20">
          <p className="text-copy-13-mono text-muted-foreground text-left sm:text-center sm:text-copy-14-mono">
            14-day refund on per-project · MIT for Open Community · Source
            code shipped on day one · Cancel subscription any time,
            keep what you have
          </p>
        </Cell>

        {/* 4. Side-by-side comparison — grouped by intent */}
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

        {/* 5. Who buys what — 2-col grid of 4 personas */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-border md:divide-y-0 md:divide-x divide-border">
              {PERSONAS.map((persona) => (
                <div
                  key={persona.label}
                  className="group transition-colors hover:bg-accent/40"
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

        {/* 6. How per-project licensing works — full-width prose */}
        <div className="border-b border-border">
          <Cell className="!p-0 border-0">
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">
                How per-project licensing works
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                Pro gives you the codebase. The cadence is yours.
              </h2>
            </div>
            <ul className="flex flex-col gap-4 p-6 text-copy-16 leading-7 text-foreground/90">
              <li>
                <strong className="text-foreground">
                  Same Pro catalog, two cadences.
                </strong>{" "}
                Pro gives you the full Pro catalog. Every template,
                every update. Pay $299 once for lifetime access, or
                $23/month for the same access with no upfront. Pick the
                cadence that fits.
              </li>
              <li>
                <strong className="text-foreground">
                  Source code is yours on day one.
                </strong>{" "}
                Cloned into your repository, deployable on your
                infrastructure. No telemetry, no phone-home, no kill
                switch. If we shut down, the source ships to your inbox.
              </li>
              <li>
                <strong className="text-foreground">
                  14-day refund window.
                </strong>{" "}
                No questions asked on the Pro one-shot. Email and we
                process it.
              </li>
              <li>
                <strong className="text-foreground">Pro Education.</strong>{" "}
                Verified students (.edu email or equivalent proof) and
                OSS maintainers get a free Pro license bound to the
                project, not the individual. The license may not be
                transferred to a non-OSS third party.{" "}
                <Link
                  href="mailto:support@deessejs.com?subject=Pro%20Education%20access"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Request access
                </Link>
                .
              </li>
            </ul>
          </Cell>
        </div>

        {/* 7. What happens when you cancel — full-width prose */}
        <div className="border-b border-border">
          <Cell className="!p-0 border-0">
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">
                What happens when you cancel
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                Templates you&apos;ve deployed keep running. Updates stop.
              </h2>
            </div>
            <ul className="flex flex-col gap-4 p-6 text-copy-16 leading-7 text-foreground/90">
              <li>
                <strong className="text-foreground">What you keep.</strong>{" "}
                The source code you&apos;ve cloned into your repositories
                stays there. Templates you&apos;ve deployed continue to run.
                Your data, your users, your uptime. None of it
                disappears.
              </li>
              <li>
                <strong className="text-foreground">What you lose.</strong>{" "}
                New templates released after cancellation are not added
                to your access. Updates and security patches stop
                landing in your mailbox.
              </li>
              <li>
                <strong className="text-foreground">
                  What you keep building.
                </strong>{" "}
                The codebase is yours. You keep shipping on top of it.
                You patch it yourself if needed. No contract, no
                penalty, no re-onboarding fee.
              </li>
              <li>
                <strong className="text-foreground">
                  What you can do later.
                </strong>{" "}
                Resubscribe any time and pick up where you left off —
                same templates, same updates, same support tier. Or
                stay cancelled and never hear from us again.
              </li>
            </ul>
          </Cell>
        </div>

        {/* 8. FAQ — 4 grouped accordions */}
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

        {/* 9. Footer CTA — 2-col grid (copy + actions) */}
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
      </div>
    </div>
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
function SubscriptionBanner() {
  const subscription = LICENSE_TYPES.find((l) => l.banner)
  if (!subscription) return null
  if (subscription.price.kind !== "subscription") return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(0,360px)] divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border transition-colors hover:bg-accent/30">
      <Cell className="gap-3">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Optional add-on
        </p>
        <h3 className="text-heading-24 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
          {subscription.name}
        </h3>
        <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          {subscription.tagline} {subscription.positioning}
        </p>
        <ul className="flex flex-col gap-2 text-copy-14 text-muted-foreground">
          {subscription.ships.map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden className="select-none">
                •
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </Cell>
      <Cell className="items-stretch justify-center gap-4">
        <PriceBlock price={subscription.price} />
        <Button asChild size="lg" className="w-full">
          <a href={subscription.cta.href}>{subscription.cta.label}</a>
        </Button>
      </Cell>
    </div>
  )
}

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

function LicenseCell({ license }: { license: LicenseType }) {
  const isRecommended = license.recommended === true
  return (
    <div
      className={cn(
        "group transition-colors hover:bg-accent/40",
        isRecommended && "bg-muted/20"
      )}
    >
      <Cell className="gap-5 h-full">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-label-13 text-muted-foreground">
              {LICENSE_KICKER[license.id]}
            </span>
            {isRecommended ? (
              <Badge variant="outline" className="text-label-12">
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
              variant={isRecommended ? "default" : "outline"}
              className="w-full"
            >
              <a href={license.cta.href}>{license.cta.label}</a>
            </Button>
          ) : (
            <Button
              asChild
              size="lg"
              variant={isRecommended ? "default" : "outline"}
              className="w-full"
            >
              <Link href={license.cta.href}>{license.cta.label}</Link>
            </Button>
          )}
        </div>
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
            {row.attribute}
          </th>
          {COMPARISON_LAYERS.map((layer) => (
            <td
              key={`${row.attribute}-${layer.id}`}
              className="py-3 pr-4 align-top text-muted-foreground"
            >
              {row.values[layer.id]}
            </td>
          ))}
        </tr>
      ))}
    </>
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
