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
  PRICING_FAQ_GROUPS,
  PRICING_LAYERS,
  type ComparisonGroup as ComparisonGroupData,
  type FaqGroup,
  type PricingLayer,
  type PricingPrice,
} from "@/lib/pricing"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Three pricing paths for the DeesseJS template catalog: Open Community (free), DeesseJS Pro ($299 one-shot, lifetime access to every Pro template), and Enterprise (custom engagements).",
}

/**
 * Pricing at /pricing.
 *
 * Renders the three-layer catalog model defined in
 * documents/internal/product/pricing.md. All copy lives in
 * @/lib/pricing so the strategy doc stays the single source of truth.
 * When the doc changes, only that file and this page template need
 * to follow.
 *
 * Layout — shared-border grid (Vercel-style). Every section lives
 * inside a single wrapper `<div>` that supplies the outer border; each
 * row inside the wrapper divides its cells with `divide-x divide-y
 * divide-border` so cells share borders without double strokes. Sections
 * are separated by `border-b border-border` on the last row of the
 * previous grid (inherited from the wrapper outline).
 *
 * Sections, top to bottom:
 *   1. Hero — centered title + lead, no image
 *   2. Three-layer cards — 3 cols with the "Recommended" lift on Pro
 *   3. Trust band — single-row mono statement under the cards
 *   4. Side-by-side comparison — 3 columns, grouped by category
 *   5. Who buys what — 2-col grid of 4 personas
 *   6. Lifetime access — full-width prose block
 *   7. Refund and license — full-width prose block
 *   8. FAQ — 3 grouped accordions in a single column
 *   9. Footer CTA — 2-col grid (copy + actions)
 *
 * Pro Education is documented in the Refund and license section and
 * in the FAQ, not as a card or a comparison column, because it shares
 * its templates with Open Community under a different license.
 *
 * Pro is sold as a single $299 lifetime package that grants access to
 * the full Pro catalog, including future templates. There is no
 * per-template price and no renewal.
 *
 * Responsive: cards stack on <md, comparison table scrolls
 * horizontally on <sm, FAQ accordion is keyboard-accessible.
 */

const PERSONAS = [
  {
    label: "Primary",
    title: "Freelance developer or small studio",
    body:
      "Bills the client $20k – $80k. Buys Pro templates to remove the parts of the build that do not pay well: auth setup, billing plumbing, audit logging. Ships under the client brand and may charge the client for the saved time.",
  },
  {
    label: "Secondary",
    title: "In-house team at a startup past the weekend stage",
    body:
      "Buys Pro the same way it buys Vercel or Linear seats. Charges it against engineering time saved.",
  },
  {
    label: "Tertiary",
    title: "Enterprise team in a regulated industry",
    body:
      "Wants Pro not because it cannot build it, but because it does not want to.",
  },
  {
    label: "Floor",
    title: "Solo indie hacker shipping a weekend project",
    body:
      "Uses Open Community free templates. The marketing pitch leans on it.",
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
  return (
    <p className="text-heading-32 tracking-tight text-foreground">
      ${price.amount}
      <span className="text-copy-14 ml-2 font-normal text-muted-foreground">
        one-shot, lifetime
      </span>
    </p>
  )
}

const LAYER_KICKER: Record<PricingLayer["id"], string> = {
  "open-community": "Open",
  pro: "Pro",
  enterprise: "Enterprise",
  "pro-education": "Education",
}

const PricingPage = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      {/* Shared-border wrapper — every section lives inside one card, including the hero */}
      <div className="border border-border bg-background rounded-none">
        {/* 1. Hero — centered, no image */}
        <div className="flex justify-center border-b border-border">
          <Cell className="items-center gap-6 lg:gap-8 text-center max-w-5xl !p-8 lg:!p-16">
            <p className="text-label-13 text-muted-foreground">Pricing</p>
            <h1 className="max-w-5xl text-heading-48 sm:text-heading-56 lg:text-heading-64 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Pricing.
            </h1>
            <p className="text-muted-foreground text-copy-18 leading-7 max-w-xl text-balance [&:not(:first-child)]:mt-0">
              Three layers in one catalog. Pay once or pay nothing. No
              subscriptions, no per-seat counts, no renewals.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="/knowledge-base/guides/install-deessejs-cli">
                  Install the CLI
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/templates">Browse templates</Link>
              </Button>
            </div>
          </Cell>
        </div>

        {/* 2. Three-layer cards — 3 cols with the "Recommended" lift on Pro */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          {PRICING_LAYERS.map((layer) => (
            <LayerCell key={layer.id} layer={layer} />
          ))}
        </div>

        {/* 3. Trust band — single-row statement */}
        <Cell className="items-center text-center border-b border-border !py-4 bg-muted/20">
          <p className="text-copy-13-mono text-muted-foreground text-left sm:text-center sm:text-copy-14-mono">
            14-day refund on Pro · MIT for Open Community · Source code shipped
            with every Pro template · No subscription, no renewal
          </p>
        </Cell>

        {/* 4. Side-by-side comparison — full-width row containing the table */}
        <div className="border-b border-border">
          <Cell className="!p-0 border-0">
            {/* Header row inside the cell */}
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">
                Side by side
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                The deep dive. Anyone comparing two layers should not have to
                read three cards.
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
                The four buyers we built the catalog around. Find the one
                closest to you.
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

        {/* 6. Lifetime access — full-width prose */}
        <div className="border-b border-border">
          <Cell className="!p-0 border-0">
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">
                What lifetime means here
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                Pro is a single $299 payment. There is no renewal, no
                subscription, and no per-template price. The terms are stated
                once in the strategy doc and not renegotiated later.
              </h2>
            </div>
            <ul className="flex flex-col gap-4 p-6 text-copy-16 leading-7 text-foreground/90">
              <li>
                <strong className="text-foreground">
                  Every Pro template, including future ones.
                </strong>{" "}
                Today and tomorrow, same package, same payment. The list of
                templates in the catalog is the list you get.
              </li>
              <li>
                <strong className="text-foreground">No lock-in.</strong>{" "}
                Source is yours from day one. If we shut down, the source ships
                to your inbox. If you leave, take it with you.
              </li>
              <li>
                <strong className="text-foreground">Amortized cost.</strong>{" "}
                $299 spread over the median shelf life of a production template
                (3 to 5 years) is $60 to $100/year. Compare to the cost of an
                auth, billing, and audit template built in-house: typically 2
                to 4 weeks of senior engineering time.
              </li>
              <li>
                <strong className="text-foreground">
                  14-day refund window.
                </strong>{" "}
                No questions asked. Email and we process it.
              </li>
            </ul>
          </Cell>
        </div>

        {/* 7. Refund and license — full-width prose */}
        <div className="border-b border-border">
          <Cell className="!p-0 border-0">
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">
                Refund and license
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                The four rules, stated once.
              </h2>
            </div>
            <ul className="flex flex-col gap-3 p-6 text-copy-16 leading-7 text-foreground/90">
              <li>
                <strong className="text-foreground">
                  14-day refund window.
                </strong>{" "}
                No questions asked, on the Pro package.
              </li>
              <li>
                <strong className="text-foreground">
                  Source code is yours.
                </strong>{" "}
                Every Pro template ships with its source code. Deploy yourself,
                or buy hosting from Nesalia Inc. separately.
              </li>
              <li>
                <strong className="text-foreground">Freelancer re-sell.</strong>{" "}
                You may re-sell the codebase to a client. The unmodified
                template may not appear in another catalog.
              </li>
              <li>
                <strong className="text-foreground">Pro Education.</strong> A
                free license for verified students (.edu email or equivalent
                proof) and OSS projects the buyer owns or contributes to. Same
                templates as Open Community, same MIT terms, bound to the
                verified buyer. The license may not be transferred to a non-OSS
                third party.{" "}
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

        {/* 8. FAQ — 3 grouped accordions */}
        <div className="border-b border-border">
          <Cell className="!p-0 border-0">
            <div className="flex flex-col gap-2 p-6 border-b border-border">
              <p className="text-label-13 text-muted-foreground">
                Frequently asked
              </p>
              <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
                Grouped by topic — skip to what you need.
              </h2>
            </div>
            <div className="flex flex-col gap-8">
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

function LayerCell({ layer }: { layer: PricingLayer }) {
  const isPro = layer.id === "pro"
  return (
    <div
      className={cn(
        "group transition-colors hover:bg-accent/40",
        isPro && "bg-muted/20"
      )}
    >
      <Cell className="gap-5 h-full">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-label-13 text-muted-foreground">
              {LAYER_KICKER[layer.id]}
            </span>
            {isPro ? (
              <Badge variant="outline" className="text-label-12">
                Recommended
              </Badge>
            ) : null}
          </div>
          <h3 className="text-heading-24 tracking-tight text-foreground !m-0">
            {layer.name}
          </h3>
          <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
            {layer.tagline}
          </p>
        </header>

        <PriceBlock price={layer.price} />

        <p className="text-copy-14 text-foreground/90 [&:not(:first-child)]:mt-0">
          {layer.forWho}
        </p>

        <p className="text-copy-14 text-foreground/90 [&:not(:first-child)]:mt-0">
          {layer.positioning}
        </p>

        <ul className="flex flex-col gap-2 text-copy-14 text-muted-foreground">
          {layer.ships.map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden="true" className="select-none">
                •
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-2">
          {layer.cta.external ? (
            <Button
              asChild
              size="lg"
              variant={isPro ? "default" : "outline"}
              className="w-full"
            >
              <a href={layer.cta.href}>{layer.cta.label}</a>
            </Button>
          ) : (
            <Button
              asChild
              size="lg"
              variant={isPro ? "default" : "outline"}
              className="w-full"
            >
              <Link href={layer.cta.href}>{layer.cta.label}</Link>
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
