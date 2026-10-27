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

const INTAKE_NOTES = [
  "Your data stays with you. We do not share intake data.",
  "Mutual NDA available on request. Countersigned within one business day.",
  "We review your codebase or requirements before the call so we start with solutions.",
] as const

/**
 * Intake section. 2-col on md+: intro copy + micro-disclosure
 * on the left, sticky form on the right. Anchored by
 * `id="intake"` so the hero CTA scrolls here.
 */
export function Intake() {
  return (
    <div
      id="intake"
      className="grid grid-cols-1 divide-y divide-border border-b border-border md:grid-cols-[minmax(0,1fr)_minmax(0,520px)] md:divide-x md:divide-y-0"
    >
      <Cell className="gap-4 lg:!p-10">
        <p className="text-label-13 tracking-wider text-muted-foreground uppercase">
          Intake
        </p>
        <h2 className="text-heading-32 tracking-tight text-balance lg:text-heading-40 [&:not(:first-child)]:mt-0">
          Tell us what you are building.
        </h2>
        <p className="text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
          Five fields, zero sales friction. Submitting immediately opens our
          engineering calendar to pick a 20-minute technical scoping call.
        </p>
        <ul className="flex flex-col gap-2 text-copy-13 text-muted-foreground">
          {INTAKE_NOTES.map((note) => (
            <li key={note} className="flex gap-2">
              <span aria-hidden className="select-none">
                •
              </span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </Cell>
      <Cell className="md:sticky md:top-20 md:self-start lg:!p-10">
        <IntakeForm />
      </Cell>
    </div>
  )
}
