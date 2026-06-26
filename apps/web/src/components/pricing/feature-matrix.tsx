import { Fragment } from "react"
import { Check, Info, Minus } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip"

import { BEST_VALUE_LABEL } from "@/lib/pricing/matrix"
import type {
  FeatureCategory,
  FeatureCellValue,
  Tier,
} from "@/lib/pricing/types"

/**
 * FeatureMatrix — the comparison table for /pricing.
 *
 * Desktop (>= lg): a sticky-header, sticky-first-column Table with
 * category header bands. Z-index dance per the CSS-Tricks sticky-table
 * guide: top-left intersection cell uses the highest z-index.
 *
 * Mobile (< lg): an Accordion per category, with each panel rendering a
 * stack of mini-cards (one per row, each showing all 3 tiers side-by-side).
 *
 * Pattern: shadcn.io pricing-feature-matrix (April 2026).
 */
export function FeatureMatrix({
  categories,
  tiers,
  bestValueLabel = BEST_VALUE_LABEL,
}: {
  categories: FeatureCategory[]
  tiers: Tier[]
  bestValueLabel?: string
}) {
  const totalCols = tiers.length + 1 // 1 for the label column

  return (
    <TooltipProvider delay={150}>
      {/* Desktop table */}
      <div className="mt-12 hidden lg:block rounded-xl border border-border/40">
        <Table>
          <TableCaption className="sr-only">
            DeesseJS pricing tier comparison across all features
          </TableCaption>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="sticky left-0 z-30 first:z-30 bg-background w-[260px] px-6 pt-8 pb-4 align-bottom">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Feature
                </span>
              </TableHead>
              {tiers.map((tier) => (
                <TableHead
                  key={tier.name}
                  className={cn(
                    "sticky top-0 z-20 min-w-[180px] bg-background border-l border-border/40 px-6 pt-8 pb-4 text-center align-bottom"
                  )}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    {tier.highlighted ? (
                      <Badge
                        variant="default"
                        className="rounded-full px-2.5 text-[10px] font-semibold"
                      >
                        {bestValueLabel}
                      </Badge>
                    ) : null}
                    <span className="text-base font-semibold tracking-tight text-foreground">
                      {tier.name}
                    </span>
                    <span className="text-2xl font-bold tabular-nums tracking-tighter text-foreground">
                      ${tier.founderPrice}
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <Fragment key={cat.name}>
                {/* Category header band */}
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableCell
                    colSpan={totalCols}
                    className="px-6 py-4 align-middle whitespace-normal"
                  >
                    <div className="text-xs font-semibold uppercase tracking-widest text-foreground">
                      {cat.name}
                    </div>
                    {cat.description ? (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {cat.description}
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
                {/* Feature rows */}
                {cat.rows.map((row) => (
                  <TableRow key={row.label}>
                    <TableHead className="sticky left-0 z-10 bg-background px-6 py-4 font-normal text-sm whitespace-normal align-middle">
                      <FeatureRowLabel label={row.label} hint={row.hint} />
                    </TableHead>
                    {row.values.map((value, i) => (
                      <TableCell
                        key={i}
                        className="bg-background border-l border-border/40 px-6 py-4 text-center align-middle"
                      >
                        <FeatureCell value={value} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile accordion */}
      <div className="mt-12 lg:hidden">
        <Accordion
          defaultValue={[categories[0]?.name ?? ""]}
          className="w-full"
        >
          {categories.map((cat) => (
            <AccordionItem key={cat.name} value={cat.name} className="border-border/50">
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline hover:text-foreground text-foreground/90 transition-colors">
                <span>
                  {cat.name}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {cat.rows.length}{" "}
                    {cat.rows.length === 1 ? "feature" : "features"}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {cat.description ? (
                  <p className="mb-3 text-xs text-muted-foreground">
                    {cat.description}
                  </p>
                ) : null}
                <div className="space-y-2">
                  {cat.rows.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-lg border border-border/40 bg-card/30 p-3"
                    >
                      <div className="mb-2 flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {row.label}
                        </span>
                        {row.hint ? (
                          <FeatureRowHint hint={row.hint} />
                        ) : null}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {tiers.map((tier, i) => (
                          <div
                            key={tier.name}
                            className={cn(
                              "rounded-md p-2 text-center",
                              tier.highlighted
                                ? "bg-foreground/5"
                                : "bg-muted/30"
                            )}
                          >
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {tier.name}
                            </div>
                            <div className="mt-1 flex justify-center">
                              <FeatureCell value={row.values[i]} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </TooltipProvider>
  )
}

/**
 * Renders a feature row label with an optional dotted-underline Tooltip
 * for the hint copy.
 */
function FeatureRowLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-foreground/90">{label}</span>
      {hint ? (
        <Tooltip>
          <TooltipTrigger
            aria-label={`More info about ${label}`}
            className="inline-flex shrink-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            <Info className="size-4" />
          </TooltipTrigger>
          <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}

/**
 * Inline hint trigger for the mobile accordion row card.
 * Uses an "i" badge rather than a dotted-underline button (saves space).
 */
function FeatureRowHint({ hint }: { hint: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label="Feature detail"
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border/60 text-[10px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        i
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Dispatches on a `FeatureCellValue` and returns the appropriate cell render.
 * Always include the `default` branch for forward-compat.
 */
function FeatureCell({ value }: { value: FeatureCellValue }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check
        className="mx-auto size-5 text-foreground"
        aria-label="Included"
      />
    ) : (
      <Minus
        className="mx-auto size-5 text-muted-foreground/40"
        aria-label="Not included"
      />
    )
  }

  if (typeof value === "string" || typeof value === "number") {
    return (
      <span className="tabular-nums text-sm text-foreground">
        {String(value)}
      </span>
    )
  }

  switch (value.kind) {
    case "text":
      return (
        <span className="tabular-nums text-sm text-foreground">
          {value.value}
        </span>
      )
    case "tooltip":
      return (
        <Tooltip>
          <TooltipTrigger className="cursor-help border-dotted border-b border-foreground/40 text-sm tabular-nums text-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
            {value.value}
          </TooltipTrigger>
          <TooltipContent>{value.hint}</TooltipContent>
        </Tooltip>
      )
    case "dash":
      return (
        <Minus
          className="mx-auto size-5 text-muted-foreground/40"
          aria-label="Not included"
        />
      )
    case "enterprise":
      return (
        <a
          href={`mailto:${value.contact}`}
          className="text-sm text-foreground underline underline-offset-4 hover:text-foreground/80"
        >
          Contact
        </a>
      )
    default:
      return null
  }
}