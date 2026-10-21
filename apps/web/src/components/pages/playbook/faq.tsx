"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

import { PLAYBOOK_FAQ } from "@/lib/playbook/faq"

/**
 * Visible FAQ accordion for the /playbook page.
 *
 * Kept in a dedicated client component so the surrounding page can
 * stay a Server Component. The data array is imported from the
 * shared `@/lib/playbook/faq` so the rendered accordion always
 * matches that source of truth.
 *
 * Mirrors the enterprise FAQ accordion in structure.
 */
export function PlaybookFaq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {PLAYBOOK_FAQ.map((item, index) => (
        <AccordionItem key={item.question} value={`playbook-faq-${index}`}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}