import { Section } from "@/app/(marketing)/_components/section"
import { FAQ } from "./faq"

/**
 * FAQ section — 2/4 split with the title on the left and the
 * accordion on the right. Splits the visual layout (which lives here)
 * from the data and accordion mechanics (which live in `./faq`).
 */
export function FAQSection() {
  return (
    <Section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 divide-y divide-border md:divide-y-0 md:divide-x divide-border">
      <div className="col-span-1 lg:col-span-2 flex flex-col gap-4 p-6 md:p-8 lg:p-12">
        <h2 className="text-heading-32 lg:text-heading-40 tracking-tighter text-balance">
          Frequently asked questions.
        </h2>
        <p className="text-muted-foreground text-copy-14 leading-6 text-balance">
          Answers to common questions about the registry, the contracts, and
          shipping with us. If you have any other questions, please reach
          out.
        </p>
      </div>
      <div className="col-span-1 lg:col-span-4 p-6 md:p-8 lg:p-12">
        <FAQ />
      </div>
    </Section>
  )
}
