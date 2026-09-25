/**
 * Mini-screenshot for the billing-portal template card.
 *
 * Static. Reads as a Stripe-style usage meter / plan card:
 *   - plan name + monthly price
 *   - usage bar (filled, monochrome)
 *   - bottom row: usage count + MRR
 *
 * Same monochrome + 1 emerald accent recipe.
 */

export function BillingPortalScreenshot() {
  return (
    <div
      aria-hidden
      className="flex h-full flex-col justify-between gap-3 bg-background p-4"
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] text-muted-foreground">
          Pro Plan
        </span>
        <span className="font-mono text-[14px] font-medium text-foreground">
          $49/mo
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              aria-hidden
              className="absolute left-0 top-0 h-full w-[68%] rounded-full bg-emerald-500"
            />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            68%
          </span>
        </div>
        <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span>6,820 / 10,000</span>
          <span className="text-foreground">MRR $1,127</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2 font-mono text-[10px]">
        <span className="text-muted-foreground">renews Dec 14</span>
        <span className="text-foreground">manage →</span>
      </div>
    </div>
  )
}
