import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/ui/accordion"

// Plain max-w-7xl container — the parent <main> provides the outer
// border-x frame, so each section's inner div just constrains width.
const bodyContainerClass =
  "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
const sectionPadding = "py-16 md:py-24 lg:py-32"

const faqs = [
  {
    question: "What is the product?",
    answer:
      "One-line answer explaining what the product is and who it's for.",
  },
  {
    question: "How does the agent integration work?",
    answer:
      "One-line answer explaining how agents plug in or use the platform.",
  },
  {
    question: "Can I use my own database and infrastructure?",
    answer:
      "One-line answer about deployment flexibility and provider support.",
  },
  {
    question: "Is there a free trial or refund policy?",
    answer:
      "One-line answer about trial length, refund window, or both.",
  },
  {
    question: "What kind of support is included?",
    answer:
      "One-line answer describing support tiers and response SLAs.",
  },
]

/**
 * HomeFaq — frequently asked questions.
 *
 * Uses the Accordion primitive (collapsible, single-open at a time).
 * The accordion width is constrained to max-w-2xl for readability.
 *
 * Dummy copy. Replace with the real FAQ once the content inventory
 * is finalized (typically sourced from sales calls and onboarding feedback).
 */
export function HomeFaq() {
  return (
    <section className={sectionPadding}>
      <div className={bodyContainerClass}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Answers to the most common questions buyers ask before signing up.
          </p>
        </div>
        <Accordion className="mx-auto mt-16 max-w-2xl">
          {faqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
