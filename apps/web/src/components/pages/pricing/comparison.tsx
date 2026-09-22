import { cn } from "@workspace/ui/lib/utils"

import { COMPARISON_GROUPS, COMPARISON_LAYERS } from "@/lib/pricing"

import { ComparisonGroup } from "./comparison-group"

/**
 * Generic shared-border cell. The wrapper card supplies the outer
 * borders; cells contribute only their own padding + optional flex
 * layout. Kept local because pricing-only.
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
 * Side-by-side comparison — table grouped by intent (what you ship,
 * updates & maintenance, rights & terms).
 */
export function Comparison() {
  return (
    <div className="border-b border-border">
      <Cell className="!p-0 border-0">
        <div className="flex flex-col gap-2 p-6 border-b border-border">
          <p className="text-label-13 text-muted-foreground">Side by side</p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
            The deep dive. Anyone comparing two license types should
            not have to read three cards.
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-copy-14">
            <thead>
              <tr className="border-b border-border">
                <th className="w-1/4 py-3 pr-4 font-semibold text-foreground">
                  Attribute
                </th>
                {COMPARISON_LAYERS.map((layer) => (
                  <th
                    key={layer.id}
                    className="w-1/4 py-3 pr-4 font-semibold text-foreground"
                  >
                    {layer.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_GROUPS.map((group) => (
                <ComparisonGroup key={group.heading} group={group} />
              ))}
            </tbody>
          </table>
        </div>
      </Cell>
    </div>
  )
}
