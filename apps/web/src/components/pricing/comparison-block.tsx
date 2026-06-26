import { Fragment } from "react"

import { cn } from "@workspace/ui/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table"

import type { ComparisonBlock as ComparisonBlockType } from "@/lib/pricing/types"

const PLATFORM_LABELS = ["DeesseJS", "supastarter", "MakerKit"] as const

/**
 * ComparisonBlock — single comparison table showing DeesseJS vs
 * supastarter vs MakerKit across all categories.
 *
 * Pattern mirrors the FeatureMatrix:
 *  - Category header bands spanning the full width
 *  - Per-row: label on the left, platform values in 3 columns
 *  - DeesseJS column highlighted with `bg-foreground/5`
 *  - Mobile: horizontal scroll via the Table primitive's overflow wrapper
 *
 * Replaces the previous "3 cards × 3 columns" layout, which forced the
 * user to mentally re-align platform columns between cards.
 */
export function ComparisonBlock({
  blocks,
}: {
  blocks: ComparisonBlockType[]
}) {
  return (
    <div className="mt-10 overflow-x-auto rounded-lg border border-border/40">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="bg-background w-[260px] px-6 py-4 align-bottom">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Capability
              </span>
            </TableHead>
            {PLATFORM_LABELS.map((label, i) => (
              <TableHead
                key={label}
                className={cn(
                  "bg-background min-w-[180px] border-l border-border/40 px-6 py-4 text-center align-bottom",
                  i === 0 && "bg-foreground/5"
                )}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span
                    className={cn(
                      "text-sm font-semibold tracking-tight",
                      i === 0 ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                  {i === 0 ? (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Recommended
                    </span>
                  ) : null}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {blocks.map((block) => (
            <Fragment key={block.title}>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableCell
                  colSpan={4}
                  className="px-6 py-3 align-middle whitespace-normal"
                >
                  <div className="text-xs font-semibold uppercase tracking-widest text-foreground">
                    {block.title}
                  </div>
                </TableCell>
              </TableRow>
              {block.rows.map((row) => (
                <TableRow key={row.label}>
                  <TableHead className="bg-background px-6 py-4 font-normal text-sm whitespace-normal align-middle">
                    {row.label}
                  </TableHead>
                  {row.values.map((value, i) => (
                    <TableCell
                      key={i}
                      className={cn(
                        "border-l border-border/40 px-6 py-4 align-middle text-sm",
                        i === 0 && "bg-foreground/5 text-foreground font-medium"
                      )}
                    >
                      {value}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}