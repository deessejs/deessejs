import { cn } from "@workspace/ui/lib/utils"

import {
  COMPARISON_LAYERS,
  type ComparisonGroup as ComparisonGroupData,
} from "@/lib/pricing"

import { AttributeTooltip } from "./attribute-tooltip"
import { ComparisonStatusIcon } from "./comparison-status-icon"

/**
 * One comparison group: a heading row spanning the table + N data
 * rows (one per attribute). Each data row highlights the Per-project
 * column to make the visual anchor when comparing.
 */
export function ComparisonGroup({
  group,
}: {
  group: ComparisonGroupData
}) {
  return (
    <>
      <tr className="border-b border-border/60 bg-muted/30">
        <th
          scope="colgroup"
          colSpan={1 + COMPARISON_LAYERS.length}
          className="py-2 pr-4 pl-6 text-left text-label-13 uppercase tracking-wider text-muted-foreground"
        >
          {group.heading}
        </th>
      </tr>
      {group.rows.map((row) => (
        <tr key={row.attribute} className="border-b border-border/60">
          <th
            scope="row"
            className="py-3 pr-4 pl-6 text-left align-top font-medium text-foreground"
          >
            {row.tooltip ? (
              <AttributeTooltip
                content={row.tooltip}
                id={`attr-${row.attribute
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")}`}
              >
                {row.attribute}
              </AttributeTooltip>
            ) : (
              row.attribute
            )}
          </th>
          {COMPARISON_LAYERS.map((layer) => {
            const status = row.status?.[layer.id] ?? "yes"
            const isPerProject = layer.id === "per-project"
            return (
              <td
                key={`${row.attribute}-${layer.id}`}
                className={cn(
                  "py-3 px-4 align-top text-muted-foreground",
                  isPerProject && "bg-muted/30",
                )}
              >
                <span className="flex items-start gap-2">
                  <ComparisonStatusIcon status={status} />
                  <span>{row.values[layer.id]}</span>
                </span>
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}
