import { Check } from "lucide-react"

import { PROOF_POINTS } from "@/lib/enterprise/proof-points"

/**
 * Four proof points shown on the /enterprise page.
 *
 * 2x2 grid with a green check icon next to each title — a single
 * visual signal that says "every one of these is a delivered
 * capability" without badges or external validation marks.
 */
export function ProofPoints() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
      {PROOF_POINTS.map((point) => (
        <div
          key={point.title}
          className="flex gap-3 p-6 lg:p-10 transition-colors hover:bg-accent/40"
        >
          <Check
            className="mt-1 size-4 shrink-0 text-emerald-500"
            aria-hidden
          />
          <div className="flex flex-col gap-1">
            <h3 className="text-heading-16 font-semibold tracking-tight text-foreground [&:not(:first-child)]:mt-0">
              {point.title}
            </h3>
            <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
              {point.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
