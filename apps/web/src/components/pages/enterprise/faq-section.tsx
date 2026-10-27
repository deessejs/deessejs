import { EnterpriseFaq } from "./faq"

/**
 * FAQ section — 2-col layout: eyebrow + heading on the left
 * (14rem fixed on md+), Accordion on the right. The actual FAQ
 * items live in `@/lib/enterprise/faq`; the visible accordion
 * component lives in `./faq`.
 */
export function FAQSection() {
  return (
    <div className="grid grid-cols-1 divide-y divide-border border-b border-border md:grid-cols-[14rem_minmax(0,1fr)] md:divide-x md:divide-y-0">
      <div className="flex flex-col gap-2 p-6 lg:p-10">
        <p className="text-label-13 tracking-wider text-muted-foreground uppercase">
          FAQ
        </p>
        <h2 className="text-heading-24 tracking-tight text-balance [&:not(:first-child)]:mt-0">
          Common questions.
        </h2>
      </div>
      <div className="p-6 lg:p-10">
        <EnterpriseFaq />
      </div>
    </div>
  )
}
