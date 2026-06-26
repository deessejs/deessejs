import { ShieldCheck } from "lucide-react"

import { Badge } from "@workspace/ui/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip"

import type { Guarantee } from "@/lib/pricing/types"

/**
 * GuaranteeStrip — thin inline strip, NOT a bordered card.
 *
 * Sits between sections with no card border. Optional Tooltip on the badge
 * surfaces the refund-process detail without competing with the tier grid
 * for "trust" attention.
 */
export function GuaranteeStrip({ guarantee }: { guarantee: Guarantee }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 text-center">
      <div className="inline-flex items-center gap-2">
        <ShieldCheck
          className="size-4 text-foreground"
          aria-hidden
        />
        <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {guarantee.label}
        </span>
        {guarantee.detail ? (
          <TooltipProvider delay={150}>
            <Tooltip>
              <TooltipTrigger
                aria-label="Refund process detail"
                className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Badge
                  variant="outline"
                  className="size-5 rounded-full border-border/60 p-0 text-[10px] font-medium"
                >
                  ?
                </Badge>
              </TooltipTrigger>
              <TooltipContent>{guarantee.detail}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">{guarantee.body}</p>
    </div>
  )
}