import { cn } from "@workspace/ui/lib/utils"

import { IntakeForm } from "./intake-form"

/**
 * Generic shared-border cell. Local to delivery.
 */
function Cell({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn("flex flex-col p-6", className)}>{children}</div>
}

/**
 * Intake section. 2-col on md+: intro copy + micro-disclosure
 * on the left, sticky form on the right. Anchored by
 * `id="intake"` so the hero CTA scrolls here.
 */
export function Intake() {
  return (
    <div
      id="intake"
      className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,520px)] divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border"
    >
      <Cell className="gap-4 lg:!p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Intake
        </p>
        <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
          Tell us what you are building.
        </h2>
        <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          Five fields, zero sales friction. Submitting immediately
          opens our engineering calendar to pick a 20-minute
          technical scoping call.
        </p>
        <ul className="flex flex-col gap-2 text-copy-13 text-muted-foreground">
          <li className="flex gap-2">
            <span aria-hidden className="select-none">
              •
            </span>
            <span>Your data stays with you. We do not share intake data.</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="select-none">
              •
            </span>
            <span>
              Mutual NDA available on request. Countersigned within
              one business day.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="select-none">
              •
            </span>
            <span>
              We review your codebase or requirements before the call
              so we start with solutions.
            </span>
          </li>
        </ul>
      </Cell>
      <Cell className="lg:!p-10 md:sticky md:top-20 md:self-start">
        <IntakeForm />
      </Cell>
    </div>
  )
}
