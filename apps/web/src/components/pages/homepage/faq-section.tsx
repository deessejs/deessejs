import { Section } from "@/components/marketing/section"
import { FAQ } from "./faq"

/**
 * FAQ section — 2/4 split with the title on the left and the
 * accordion on the right. Splits the visual layout (which lives here)
 * from the data and accordion mechanics (which live in `./faq`).
 */
export function FAQSection() {
  return (
    <Section className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-6">
      <div className="col-span-1 flex flex-col gap-4 p-6 md:p-8 lg:col-span-2 lg:p-12">
        <h2 className="text-heading-32 tracking-tighter text-balance lg:text-heading-40">
          Frequently asked questions.
        </h2>
        <p className="text-copy-14 leading-6 text-balance text-muted-foreground">
          Answers to common questions about the registry, the contracts, and
          shipping with us. If you have any other questions, please reach out.
        </p>
      </div>
      <div className="col-span-1 p-6 md:p-8 lg:col-span-4 lg:p-12">
        <FAQ />
      </div>
    </Section>
  )
}
