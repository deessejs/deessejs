import { Check, CircleAlert, Minus, X } from "lucide-react"

import type { ComparisonStatus } from "@/lib/pricing"

/**
 * Status icon for a comparison cell.
 *
 * - `yes`     → green check (Check)
 * - `partial` → amber alert (CircleAlert)
 * - `no`      → rose x (X)
 * - `na`      → muted dash (Minus)
 */
export function ComparisonStatusIcon({ status }: { status: ComparisonStatus }) {
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
