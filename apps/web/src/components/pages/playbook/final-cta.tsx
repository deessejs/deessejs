import { Form } from "./form"

/**
 * /playbook FinalCta — repeats the email form, sets expectations
 * about what arrives in the inbox, and points at the privacy page.
 *
 * Mirrors the `FinalCta` slot used by /pricing and /enterprise: a
 * full-width band at the foot of the page. Same `border-t border-b
 * border-border` separation as elsewhere on the page so the rhythm
 * matches.
 *
 * The expectations copy is the same wording that gets used after a
 * successful submission, so the page reads consistently before and
 * after the form fires.
 */
export function FinalCta() {
  return (
    <section
      aria-labelledby="playbook-final-cta-heading"
      className="border-t border-border px-6 py-16 text-center md:py-20 lg:py-24"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
        <h2
          id="playbook-final-cta-heading"
          className="text-heading-32 tracking-tight text-balance"
        >
          Get the playbook
        </h2>
        <p className="text-muted-foreground text-copy-18 leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0">
          You'll get one email with the PDF. If you opt in to updates,
          you may also receive occasional messages about DeesseJS.
          Unsubscribe any time from the link at the bottom of any
          email we send.
        </p>
        <Form />
      </div>
    </section>
  )
}
