import { cn } from "@workspace/ui/lib/utils"

import { PROCESS_STEPS, type ProcessStep } from "../_lib/process-steps"

/**
 * Three-step horizontal timeline for the /enterprise page.
 *
 * Layout:
 *   - Eyebrow + heading on top (full-width), inside the standard
 *     SectionHeading recipe (eyebrow + h2 + lead).
 *   - Three steps below in a 1 / 2 / 3-col grid (mobile / tablet /
 *     desktop). Each cell carries a step number, title, and body.
 *
 * No icons, no decorative lines. The mono step number does the
 * visual work, matching the changelog timeline aesthetic.
 */
export function ProcessTimeline() {
  return (
    <div className="flex flex-col gap-6 p-6 lg:p-10">
      <header className="flex flex-col gap-2">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          How it works
        </p>
        <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
          Three steps from inquiry to handover.
        </h2>
      </header>
      <ol className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border">
        {PROCESS_STEPS.map((step, index) => (
          <ProcessStepCell key={step.step} step={step} isLast={index === PROCESS_STEPS.length - 1} />
        ))}
      </ol>
    </div>
  )
}

function ProcessStepCell({
  step,
  isLast,
}: {
  step: ProcessStep
  isLast: boolean
}) {
  return (
    <li
      className={cn(
        "flex flex-col gap-3 md:px-6 lg:px-8",
        !isLast && "md:border-r md:border-border/0",
      )}
    >
      <span className="text-copy-13-mono text-muted-foreground">{step.step}</span>
      <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
        {step.title}
      </h3>
      <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
        {step.body}
      </p>
    </li>
  )
}
