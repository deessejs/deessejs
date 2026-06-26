import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/ui/accordion"

import type { PricingFaq as PricingFaqType } from "@/lib/pricing/types"

/**
 * PricingFaq — pricing-specific subset of the home page FAQ.
 *
 * Same Base UI Accordion primitive as the home page (no `type="single"`
 * collapsible prop in this variant — `openMultiple={false}` + an explicit
 * `defaultValue` controls single-open behaviour).
 */
export function PricingFaq({ faqs }: { faqs: PricingFaqType[] }) {
  return (
    <div className="mx-auto max-w-2xl">
      <Accordion className="w-full" defaultValue={[faqs[0]?.question ?? ""]}>
        {faqs.map((faq) => (
          <AccordionItem key={faq.question} value={faq.question} className="border-border/50">
            <AccordionTrigger className="text-left text-base font-medium hover:no-underline hover:text-foreground text-foreground/90 transition-colors">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}