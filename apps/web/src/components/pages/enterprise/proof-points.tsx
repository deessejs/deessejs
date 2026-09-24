import { Check } from "lucide-react"

import { KbCardGrid } from "@/components/knowledge-base/kb-card-grid"

import { PROOF_POINTS } from "@/lib/enterprise/proof-points"

/**
 * Four proof points shown on the /enterprise page.
 *
 * 2x2 grid with a green check icon next to each title — a single
 * visual signal that says "every one of these is a delivered
 * capability" without badges or external validation marks.
 *
 * Border strategy (Pattern C from `.claude/skills/tailwind-borders`):
 * `KbCardGrid` with `md:grid-cols-2` paints the wrapper with
 * `bg-border` and `gap-px` carries the separator between cells. This
 * replaces the old `[&>li:nth-child(...)]:md:border-r-0` arithmetic
 * which was fragile to add/remove proof points.
 */
export function ProofPoints() {
  return (
    <div className="border-b border-border">
      <KbCardGrid className="md:grid-cols-2">
        {PROOF_POINTS.map((point) => (
          <div
            key={point.title}
            className="flex gap-3 p-6 transition-colors hover:bg-accent/40 lg:p-10"
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
      </KbCardGrid>
    </div>
  )
}
