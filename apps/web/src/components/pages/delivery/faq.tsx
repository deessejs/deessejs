"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

import { DELIVERY_FAQ } from "@/lib/delivery/faq"

/**
 * Visible FAQ accordion for the /delivery page.
 *
 * Data lives in `@/lib/delivery/faq` (shared with the JsonLd) so the
 * schema and the visible Accordion cannot drift.
 */
export function DeliveryFaq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {DELIVERY_FAQ.map((item, index) => (
        <AccordionItem key={item.question} value={`delivery-faq-${index}`}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
