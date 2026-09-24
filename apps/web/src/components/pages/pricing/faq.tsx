import { cn } from "@workspace/ui/lib/utils"

import { PRICING_FAQ_GROUPS } from "@/lib/pricing"

import { FAQCell } from "./faq-cell"

/**
 * Generic shared-border cell. Local to pricing.
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
 * FAQ — 4 grouped accordions (licensing, post-cancellation, billing,
 * roadmap). Each group is rendered by `<FAQCell>` with its own
 * accordion state.
 */
export function FAQ() {
  return (
    <div className="border-b border-border">
      <Cell className="!p-0 border-0">
        <div className="flex flex-col gap-2 p-6 border-b border-border">
          <p className="text-label-13 text-muted-foreground">
            Frequently asked
          </p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
            Grouped by topic. Skip to what you need.
          </h2>
        </div>
        <div className="flex flex-col gap-4">
          {PRICING_FAQ_GROUPS.map((group) => (
            <FAQCell key={group.heading} group={group} />
          ))}
        </div>
      </Cell>
    </div>
  )
}
