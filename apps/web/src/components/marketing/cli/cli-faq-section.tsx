import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

import { CLI_FAQ } from "./cli-faq-data"

/**
 * The FAQ section: 2/4 split (heading + lead on the left, the
 * 3 questions as an accordion on the right). Mirrors the visual
 * rhythm of the homepage FAQ section.
 */
export function CliFaqSection() {
  return (
    <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
      <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Before you start
        </p>
        <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
          What the CLI does, and what it does not.
        </h2>
        <p className="max-w-md text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
          Three answers to the questions a first-time visitor asks most often.
        </p>
      </div>
      <Accordion
        type="single"
        collapsible
        className="lg:col-span-4 border-0 !p-0"
      >
        {CLI_FAQ.map((item, idx) => (
          <AccordionItem
            key={item.question}
            value={`item-${idx}`}
            className="border-b border-border last:border-b-0"
          >
            <AccordionTrigger className="px-6 py-5 lg:px-8 text-copy-16 font-medium text-foreground hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-5 lg:px-8 text-copy-14 leading-6 text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
