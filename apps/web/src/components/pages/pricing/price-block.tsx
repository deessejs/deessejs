import {
  annualBreakdown,
  type BillingCadence,
  type PricingPrice,
} from "@/lib/pricing"

/**
 * Renders the price line for a plan. Three shapes:
 *
 * - `free`         → plain "Free"
 * - `custom`       → "Custom, per engagement"
 * - `subscription` → renders the amount for the requested cadence.
 *   Monthly: the monthly amount + "/ month, cancel any time".
 *   Annual: the equivalent monthly ($299 / 12 = $24.92) as the
 *   headline figure, with a secondary line "Billed annually at $299
 *   (saves 14%)" so the visitor sees both the monthly framing and
 *   the actual annual charge.
 *
 * The annual breakdown (monthly-equivalent and savings percent) is
 * derived from the configuration in `lib/pricing.ts` via
 * `annualBreakdown`. Never hardcode those values here.
 */
export function PriceBlock({
  price,
  cadence,
}: {
  price: PricingPrice
  cadence: BillingCadence
}) {
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

  const currencySymbol = price.currency === "USD" ? "$" : ""
  if (cadence === "monthly") {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-heading-32 tracking-tight text-foreground">
          {currencySymbol}
          {price.monthly.amount}
          <span className="text-copy-14 ml-2 font-normal text-muted-foreground">
            / month, cancel any time
          </span>
        </p>
        <p className="text-copy-13 text-muted-foreground [&:not(:first-child)]:mt-0">
          Taxes included. Annual billing saves two months.
        </p>
      </div>
    )
  }

  const { monthlyEquivalent, savingsPercent } = annualBreakdown(price)
  const monthlyEquivalentDisplay = monthlyEquivalent.toFixed(2)
  return (
    <div className="flex flex-col gap-1">
      <p className="text-heading-32 tracking-tight text-foreground">
        {currencySymbol}
        {monthlyEquivalentDisplay}
        <span className="text-copy-14 ml-2 font-normal text-muted-foreground">
          / month
        </span>
      </p>
      <p className="text-copy-13 text-muted-foreground [&:not(:first-child)]:mt-0">
        Billed annually at {currencySymbol}
        {price.annual.amount} (saves {savingsPercent}%). Taxes included.
      </p>
    </div>
  )
}
