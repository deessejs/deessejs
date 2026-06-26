import { Check, Zap } from "lucide-react"

import { Badge } from "@workspace/ui/components/ui/badge"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import { Separator } from "@workspace/ui/components/ui/separator"

import type { Tier } from "@/lib/pricing/types"

/**
 * TierGrid — 3-card tier row (Raze Layer 1: Package).
 *
 * Layout (matches the Vercel/shadcn pricing pattern):
 *   1. Header   — tier name + inline "Most popular" badge + description
 *   2. Separator
 *   3. Price    — `$` + amount (text-5xl) + unit line
 *   4. CTA      — full-width button (primary for highlighted, outline for rest)
 *   5. Reassurance line (centered)
 *   6. Separator
 *   7. Features — "Key features:" label + 5 bulleted items with check icons
 *
 * All cards share the same surface (`bg-background`) and 1px border. The
 * highlighted card is differentiated ONLY by:
 *   - the inline `Most popular` badge with a Zap icon
 *   - the primary (filled) CTA variant
 *
 * CTA href: uses `buyUrl` if set, else anchors to `#${slug}`.
 */
export function TierGrid({ tiers }: { tiers: Tier[] }) {
  return (
    <div className="mt-10 grid w-full max-w-5xl gap-6 mx-auto md:grid-cols-2 lg:grid-cols-3">
      {tiers.map((tier) => {
        const ctaHref = tier.buyUrl ?? `#${tier.slug ?? tier.name.toLowerCase()}`
        return (
          <Card
            key={tier.name}
            className="flex w-full flex-col rounded-lg border bg-background p-8 shadow-sm"
          >
            <CardHeader className="p-0">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl font-semibold">
                    {tier.name}
                  </CardTitle>
                  {tier.highlighted ? (
                    <Badge className="rounded-full border-transparent bg-foreground px-2 py-0.5 text-xs font-medium text-background [&_svg]:size-3 flex items-center gap-1">
                      <Zap className="size-3" aria-hidden />
                      Most popular
                    </Badge>
                  ) : null}
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  {tier.description}
                </CardDescription>
              </div>
            </CardHeader>

            <Separator className="my-6 bg-border" />

            <div className="flex items-start font-semibold">
              <span className="text-xl leading-none">$</span>
              <span className="text-5xl leading-none tracking-tight">
                {tier.founderPrice}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              one-time · lifetime updates
            </p>

            <Button
              className="mt-4 mb-2 h-9 w-full rounded-md font-medium"
              variant={tier.highlighted ? "default" : "outline"}
              nativeButton={false}
              render={<a href={ctaHref} />}
            >
              {tier.cta}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              14-day money-back guarantee
            </p>

            <Separator className="my-6 bg-border" />

            <CardContent className="p-0">
              <p className="mb-3 text-sm font-semibold">Key features:</p>
              <ul className="flex flex-col gap-2">
                {tier.features.slice(0, 5).map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check
                      className="size-4 shrink-0 text-foreground"
                      aria-hidden
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}