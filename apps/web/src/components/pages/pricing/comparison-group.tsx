import { cn } from "@workspace/ui/lib/utils"

import {
  COMPARISON_LAYERS,
  type ComparisonGroup as ComparisonGroupData,
} from "@/lib/pricing"

import { AttributeTooltip } from "./attribute-tooltip"
import { ComparisonStatusIcon } from "./comparison-status-icon"

/**
 * One comparison group: a heading row spanning the table + N data
 * rows (one per attribute). The Professional column is highlighted
 * to give the comparison table a visual anchor; the highlight is a
 * visual choice, not a vocabulary of "per-project" tiers (the
 * vocabulary now is monthly or annual subscriptions).
 */
export function ComparisonGroup({ group }: { group: ComparisonGroupData }) {
  return (
    <>
      <tr className="border-b border-border/60 bg-muted/30">
        <th
          scope="colgroup"
          colSpan={1 + COMPARISON_LAYERS.length}
          className="py-2 pr-4 pl-6 text-left text-label-13 tracking-wider text-muted-foreground uppercase"
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
            const isRecommended = layer.id === "professional"
            return (
              <td
                key={`${row.attribute}-${layer.id}`}
                className={cn(
                  "px-4 py-3 align-top text-muted-foreground",
                  isRecommended && "bg-muted/30"
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
