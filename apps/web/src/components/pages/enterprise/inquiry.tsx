import { InquiryForm } from "./inquiry-form"

/**
 * Inquiry section — 2-col on md+: copy + micro-disclosure on the
 * left, sticky inquiry form on the right. Anchored by `id="inquiry"`
 * so the hero "Talk to us about Enterprise" CTA can scroll here.
 */
export function Inquiry() {
  return (
    <div
      id="inquiry"
      className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,520px)] divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border"
    >
      <div className="flex flex-col gap-4 p-6 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Inquiry
        </p>
        <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
          Tell us what you are building.
        </h2>
        <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          Four fields, two minutes. We reply with a scope within two
          business days.
        </p>
        <ul className="flex flex-col gap-2 text-copy-13 text-muted-foreground">
          <li className="flex gap-2">
            <span aria-hidden className="select-none">
              •
            </span>
            <span>
              Your data stays with you. We do not share inquiries.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="select-none">
              •
            </span>
            <span>
              Size, budget, timeline? We ask in the follow-up, not the
              form.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="select-none">
              •
            </span>
            <span>
              No account, no signup. Submitting opens your mail client
              with the inquiry pre-filled.
            </span>
          </li>
        </ul>
      </div>
      <div className="p-6 lg:p-10 md:sticky md:top-20 md:self-start">
        <InquiryForm />
      </div>
    </div>
  )
}
