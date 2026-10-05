import { CLI_PARCOURS } from "./cli-parcours-data"

/**
 * The "parcours" section: three numbered cells showing the
 * `deessejs list → info → init` journey in the order a developer
 * actually uses them. The current section replaces the previous
 * 3-card "Commands" grid (which read as a tech reference).
 */
export function CliParcours() {
  return (
    <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
      {CLI_PARCOURS.map((step, idx) => (
        <div key={step.name} className="flex flex-col gap-3 p-6 lg:p-8">
          <span className="font-mono text-copy-13 text-muted-foreground">
            Step {String(idx + 1).padStart(2, "0")}
          </span>
          <h3 className="font-mono text-copy-16 font-medium text-foreground !m-0">
            {step.name}
          </h3>
          <p className="text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
            {step.body}
          </p>
          <code className="mt-1 rounded bg-muted px-2 py-1 font-mono text-copy-12 text-foreground/90">
            $ {step.command}
          </code>
        </div>
      ))}
    </div>
  )
}
