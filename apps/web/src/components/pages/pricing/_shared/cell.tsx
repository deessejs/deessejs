import { cn } from "@workspace/ui/lib/utils"
import type { ReactNode } from "react"

/**
 * Generic shared-border cell. The wrapper card supplies the outer
 * borders; cells contribute only their own padding + optional flex
 * layout.
 *
 * Local to pricing. Was duplicated in license-cell.tsx,
 * comparison.tsx, personas.tsx, and enterprise-ready.tsx with the
 * same 4-line signature. Single source of truth now.
 */
export function Cell({
  className,
  children,
}: {
  className?: string | undefined
  children: ReactNode
}) {
  return <div className={cn("flex flex-col p-6", className)}>{children}</div>
}
