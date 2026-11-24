import type { LicenseType } from "@/lib/pricing"

/** Renders a free label or the approved seat-based pricing description. */
export function PriceBlock({ price }: { price: LicenseType["price"] }) {
  if (price.kind === "free") {
    return (
      <p className="text-heading-32 tracking-tight text-foreground">Free</p>
    )
  }
  if (price.kind === "seat-based") {
    return (
      <div>
        <p className="text-heading-32 tracking-tight text-foreground">
          Per seat
        </p>
        <p className="text-copy-13 text-muted-foreground">
          Price details are not yet available.
        </p>
      </div>
    )
  }
}
