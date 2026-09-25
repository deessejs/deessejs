import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { cn } from "@workspace/ui/lib/utils"

import type { FaqGroup } from "@/lib/pricing"

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
 * One FAQ group — heading + accordion of items. Each item's value
 * is the `${group.heading}-${index}` pair so the accordion state
 * stays scoped to the group (different groups can have one item open
 * simultaneously without interfering).
 */
export function FAQCell({ group }: { group: FaqGroup }) {
  return (
    <Cell className="gap-4">
      <h3 className="text-label-13 uppercase tracking-wider text-muted-foreground">
        {group.heading}
      </h3>
      <Accordion type="single" collapsible className="w-full">
        {group.items.map((item, index) => (
          <AccordionItem
            key={item.question}
            value={`${group.heading}-${index}`}
          >
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>
              <p className="text-copy-14 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
                {item.answer}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Cell>
  )
}
