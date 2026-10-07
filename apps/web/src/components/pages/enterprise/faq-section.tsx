import { EnterpriseFaq } from "./faq"

/**
 * FAQ section — 2-col layout: eyebrow + heading on the left
 * (14rem fixed on md+), Accordion on the right. The actual FAQ
 * items live in `@/lib/enterprise/faq`; the visible accordion
 * component lives in `./faq`.
 */
export function FAQSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[14rem_minmax(0,1fr)] divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
      <div className="flex flex-col gap-2 p-6 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
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
