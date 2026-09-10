import Link from "next/link"
import type { Metadata } from "next"

import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

import {
  COMPARISON_LAYERS,
  COMPARISON_ROWS,
  PRICING_FAQ,
  PRICING_LAYERS,
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
 * Layout (in order):
 *   ┌─ Hero: title + lead ──────────────────────────────────────┐
 *   ├─ 3 cards (Open Community, Pro, Enterprise) ───────────────┤
 *   ├─ Detailed comparison table (3 columns) ────────────────────┤
 *   ├─ Lifetime access ──────────────────────────────────────────┤
 *   ├─ Refund & license terms (+ Pro Education note) ────────────┤
 *   ├─ Persona block (freelance, in-house, enterprise, floor) ───┤
 *   ├─ FAQ (Accordion) ──────────────────────────────────────────┤
 *   └─ Footer CTA strip ─────────────────────────────────────────┘
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
 * horizontally on <md, FAQ accordion is keyboard-accessible.
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
      <p className="text-heading-32 tracking-tight text-foreground">
        Free
      </p>
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

const LayerCard = ({ layer }: { layer: PricingLayer }) => {
  const isPro = layer.id === "pro"
  return (
    <Card
      className={`flex h-full flex-col gap-5 p-6 ${
        isPro ? "border-foreground/20" : ""
      }`}
    >
      <header className="flex flex-col gap-2">
        <span className="text-label-13 uppercase tracking-wider text-muted-foreground">
          {LAYER_KICKER[layer.id]}
        </span>
        <h3 className="text-heading-24 tracking-tight text-foreground !m-0">
          {layer.name}
        </h3>
        <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
          {layer.tagline}
        </p>
      </header>

      <PriceBlock price={layer.price} />

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
          <Button asChild variant="outline" className="w-full">
            <a href={layer.cta.href}>{layer.cta.label}</a>
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href={layer.cta.href}>{layer.cta.label}</Link>
          </Button>
        )}
      </div>
    </Card>
  )
}

const PricingPage = () => {
  return (
    <article className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:gap-20 lg:py-24">
      {/* FAQPage JSON-LD: derived from PRICING_FAQ so the schema and the
          visible accordion never drift apart. Triggering a rich-result
          FAQ block in the SERPs hinges on having each question/answer
          as a `Question` node, with `acceptedAnswer.text` carrying the
          copy verbatim. The visible Accordion still owns the UI; the
          script is crawler-only. */}
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
            // No `publisher` here: the FAQPage lives inside a single
            // page already covered by the global Organization entity,
            // and linking it again would just duplicate `@id` references.
            // The Organization is reachable via the root WebSite script
            // emitted in apps/web/src/app/layout.tsx.
          }),
        }}
      />
      {/* Hero */}
      <header className="flex flex-col gap-6">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Pricing
        </p>
        <h1 className="text-heading-56 tracking-tight">
          Pricing.
        </h1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
          Three layers in one catalog. Pay once or pay nothing. No
          subscriptions, no per-seat counts, no renewals.
        </p>
      </header>

      <Separator />

      {/* Three-layer cards */}
      <section className="flex flex-col gap-8" aria-labelledby="layers-heading">
        <div className="flex flex-col gap-2">
          <h2 id="layers-heading" className="text-heading-32 tracking-tight">
            The three layers
          </h2>
          <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
            Every template ships complete. A free landing template is a
            complete landing template, not a stripped-down Pro. Pro contains
            more built-in work, not more knobs.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PRICING_LAYERS.map((layer) => (
            <LayerCard key={layer.id} layer={layer} />
          ))}
        </div>
      </section>

      <Separator />

      {/* Detailed comparison table */}
      <section className="flex flex-col gap-6" aria-labelledby="comparison-heading">
        <div className="flex flex-col gap-2">
          <h2 id="comparison-heading" className="text-heading-32 tracking-tight">
            Side by side
          </h2>
          <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
            The deep dive. Anyone comparing two layers should not have to read
            three cards.
          </p>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
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
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.attribute} className="border-b border-border/60">
                  <th
                    scope="row"
                    className="py-3 pr-4 text-left align-top font-medium text-foreground"
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
            </tbody>
          </table>
        </div>
      </section>

      <Separator />

      {/* Lifetime access */}
      <section className="flex flex-col gap-6" aria-labelledby="lifetime-heading">
        <div className="flex flex-col gap-2">
          <h2 id="lifetime-heading" className="text-heading-32 tracking-tight">
            What lifetime means here
          </h2>
          <p className="text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Pro is a single $299 payment. There is no renewal, no subscription,
            and no per-template price. The terms are stated once in the
            strategy doc and not renegotiated later.
          </p>
        </div>
        <ul className="flex flex-col gap-4 text-copy-16 leading-7 text-foreground/90">
          <li>
            <strong className="text-foreground">
              Every Pro template, including future ones.
            </strong>{" "}
            Today and tomorrow, same package, same payment. The list of
            templates in the catalog is the list you get.
          </li>
          <li>
            <strong className="text-foreground">No lock-in.</strong> Source is
            yours from day one. If we shut down, the source ships to your
            inbox. If you leave, take it with you.
          </li>
          <li>
            <strong className="text-foreground">Amortized cost.</strong> $299
            spread over the median shelf life of a production template (3 to 5
            years) is $60 to $100/year. Compare to the cost of an auth,
            billing, and audit template built in-house: typically 2 to 4 weeks
            of senior engineering time.
          </li>
          <li>
            <strong className="text-foreground">14-day refund window.</strong>{" "}
            No questions asked. Email and we process it.
          </li>
        </ul>
      </section>

      <Separator />

      {/* Refund & license */}
      <section className="flex flex-col gap-6" aria-labelledby="refund-heading">
        <div className="flex flex-col gap-2">
          <h2 id="refund-heading" className="text-heading-32 tracking-tight">
            Refund and license
          </h2>
        </div>
        <ul className="flex flex-col gap-3 text-copy-16 leading-7 text-foreground/90">
          <li>
            <strong className="text-foreground">14-day refund window.</strong>{" "}
            No questions asked, on the Pro package.
          </li>
          <li>
            <strong className="text-foreground">Source code is yours.</strong>{" "}
            Every Pro template ships with its source code. Deploy yourself, or
            buy hosting from Nesalia Inc. separately.
          </li>
          <li>
            <strong className="text-foreground">Freelancer re-sell.</strong>{" "}
            You may re-sell the codebase to a client. The unmodified template
            may not appear in another catalog.
          </li>
          <li>
            <strong className="text-foreground">Pro Education.</strong> A free
            license for verified students (.edu email or equivalent proof) and
            OSS projects the buyer owns or contributes to. Same templates as
            Open Community, same MIT terms, bound to the verified buyer. The
            license may not be transferred to a non-OSS third party.{" "}
            <Link
              href="mailto:support@deessejs.com?subject=Pro%20Education%20access"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Request access
            </Link>
            .
          </li>
        </ul>
      </section>

      <Separator />

      {/* Persona block */}
      <section className="flex flex-col gap-6" aria-labelledby="persona-heading">
        <div className="flex flex-col gap-2">
          <h2 id="persona-heading" className="text-heading-32 tracking-tight">
            Who buys what
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PERSONAS.map((persona) => (
            <Card key={persona.label} className="flex h-full flex-col gap-3 p-6">
              <span className="text-label-13 font-mono uppercase tracking-wider text-muted-foreground">
                {persona.label}
              </span>
              <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                {persona.title}
              </h3>
              <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                {persona.body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* FAQ */}
      <section className="flex flex-col gap-6" aria-labelledby="faq-heading">
        <div className="flex flex-col gap-2">
          <h2 id="faq-heading" className="text-heading-32 tracking-tight">
            Frequently asked
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {PRICING_FAQ.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>
                <p className="text-copy-14 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
                  {item.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <Separator />

      {/* Footer CTA */}
      <section
        aria-labelledby="cta-heading"
        className="flex flex-col items-start gap-6 rounded-lg border border-border bg-muted/30 p-8 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex flex-col gap-2">
          <h2
            id="cta-heading"
            className="text-heading-24 tracking-tight text-foreground !m-0"
          >
            Talk to us
          </h2>
          <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
            Email is the fastest path. We read everything that comes in.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/templates">Browse the catalog</Link>
          </Button>
          <Button asChild variant="outline">
            <a href="mailto:support@deessejs.com?subject=Pricing">Email us</a>
          </Button>
        </div>
      </section>
    </article>
  )
}

export default PricingPage
