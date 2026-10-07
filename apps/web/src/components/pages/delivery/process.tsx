import { cn } from "@workspace/ui/lib/utils"

import { PROCESS_STEPS, type ProcessStep } from "@/lib/delivery/process"

/**
 * Four-step horizontal protocol. The engineering manifest.
 *
 * Layout: 4-col grid on md+. The mono step number does the visual
 * work. No decorative lines, no icons. Each step kills a specific
 * CTO concern: meeting overhead (01), visibility (02), vendor
 * lock-in (03), dependency on the consultant (04).
 */
export function Process() {
  return (
    <div className="border-b border-border">
      <div className="flex flex-col gap-6 p-6 lg:p-10">
        <header className="flex flex-col gap-2">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            How we work
          </p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
            Four engineering protocols, zero agency theater.
          </h2>
        </header>
        <ol className="grid grid-cols-1 gap-6 md:grid-cols-4 md:gap-0 md:divide-x md:divide-border">
          {PROCESS_STEPS.map((step, index) => (
            <ProcessCell
              key={step.number}
              step={step}
              isLast={index === PROCESS_STEPS.length - 1}
            />
          ))}
        </ol>
      </div>
    </div>
  )
}

function ProcessCell({
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
      <span className="font-mono text-copy-13 text-muted-foreground">
        {step.number}
      </span>
      <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
        {step.title}
      </h3>
      <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
        {step.body}
      </p>
    </li>
  )
}
