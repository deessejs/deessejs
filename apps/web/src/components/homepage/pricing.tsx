import { Check } from "lucide-react"

import { Badge } from "@workspace/ui/components/ui/badge"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"

// Plain max-w-7xl container — the parent <main> provides the outer
// border-x frame, so each section's inner div just constrains width.
const bodyContainerClass =
  "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
const sectionPadding = "py-16 md:py-24 lg:py-32"

const tiers = [
  {
    name: "Tier one",
    description: "One-line description of who this tier is for.",
    price: "$XX",
    period: "/month",
    features: [
      "Feature bullet one",
      "Feature bullet two",
      "Feature bullet three",
      "Feature bullet four",
    ],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Tier two",
    description: "One-line description of who this tier is for.",
    price: "$XX",
    period: "/month",
    features: [
      "Everything in Tier one, plus:",
      "Feature bullet two",
      "Feature bullet three",
      "Feature bullet four",
      "Feature bullet five",
    ],
    cta: "Get started",
    highlighted: true,
  },
  {
    name: "Tier three",
    description: "One-line description of who this tier is for.",
    price: "$XX",
    period: "/month",
    features: [
      "Everything in Tier two, plus:",
      "Feature bullet two",
      "Feature bullet three",
      "Feature bullet four",
    ],
    cta: "Get started",
    highlighted: false,
  },
]

/**
 * HomePricing — 3-tier pricing grid.
 *
 * The middle tier is highlighted with a "Most popular" badge, a primary
 * border ring, and a solid (instead of outline) CTA button.
 *
 * Dummy data. Replace with the real tier inventory (Starter/Pro/Team
 * pricing per the project memory) when the marketing content is
 * finalized.
 */
export function HomePricing() {
  return (
    <section className={sectionPadding}>
      <div className={bodyContainerClass}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pricing
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Optional subtitle that anchors the value-to-cost relationship.
          </p>
        </div>
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={
                tier.highlighted
                  ? "border-primary ring-2 ring-primary/20"
                  : undefined
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{tier.name}</CardTitle>
                  {tier.highlighted ? (
                    <Badge>Most popular</Badge>
                  ) : null}
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    {tier.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {tier.period}
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.highlighted ? "default" : "outline"}
                >
                  {tier.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
