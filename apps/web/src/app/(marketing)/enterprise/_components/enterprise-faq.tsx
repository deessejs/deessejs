"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

import { ENTERPRISE_FAQ } from "../_lib/enterprise-faq"

/**
 * Visible FAQ accordion for the /enterprise page.
 *
 * Kept in a dedicated client component so the surrounding page can
 * stay a Server Component. The data array is imported from the
 * shared `_lib/enterprise-faq.ts` so the JSON-LD and the visible
 * accordion are guaranteed to render the same questions and answers.
 */
export function EnterpriseFaq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {ENTERPRISE_FAQ.map((item, index) => (
        <AccordionItem key={item.question} value={`enterprise-faq-${index}`}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
