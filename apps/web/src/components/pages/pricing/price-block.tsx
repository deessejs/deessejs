import type { PricingPrice } from "@/lib/pricing"

/**
 * Renders the price line for a license card. Four shapes:
 *
 * - `free`         → plain "Free"
 * - `custom`       → "Custom, per engagement"
 * - `subscription` → "$N / month" or "$N / year, cancel any time"
 * - `one-shot` (default) → "$N, one-shot, lifetime"
 */
export function PriceBlock({ price }: { price: PricingPrice }) {
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
    const cadence = price.cadence === "month" ? "/ month" : "/ year"
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
