import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

import { HOME_FAQ } from "@/lib/marketing/home-faq"

/**
 * FAQ accordion rendered on the marketing homepage (Section 14).
 *
 * 2/4 split with the title + intro on the left (2/6 on lg) and the
 * accordion on the right (4/6 on lg). The actual FAQ items live in
 * `lib/marketing/home-faq.ts` so the page file does not embed the
 * ~75 lines of inline answers.
 *
 * Single-open behaviour (`type="single" collapsible`) is intentional:
 * only one answer visible at a time, matching the rest of the
 * marketing site.
 */
export function FAQ() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {HOME_FAQ.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          className="last:border-b-0 border-b border-border py-4 first:pt-0"
        >
          <AccordionTrigger className="text-left no-underline hover:no-underline py-0 text-base font-medium">
            {item.question}
          </AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
