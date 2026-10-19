import { Form } from "./form"
import { PLAYBOOK_LEAD } from "./content/toc"

/**
 * /playbook hero. First screen, two-column layout.
 *
 * Layout:
 *   ┌─ Left column ─────────────────┬─ Right column ────────────┐
 *   │ H1                            │                           │
 *   │ Lead                          │   Cover (mockup)          │
 *   │ Email input                   │                           │
 *   │ Submit button                 │                           │
 *   │ Consent checkbox + privacy   │                           │
 *   └────────────────────────────────┴───────────────────────────┘
 *
 * On `lg+` the two columns share a vertical divider and align
 * centrally. On mobile the cover stacks below the form.
 *
 * Title and lead copy, the email field, button, and the optional
 * consent checkbox all live in the left column. The form repeats
 * on this page only (it does not duplicate in the FinalCta that
 * closes the page). The cover mockup in the right column is a
 * labelled placeholder until the real PDF lands at
 * `apps/web/public/playbook/cover.{png|svg}`; a `TODO(v0.2)`
 * comment marks the swap.
 */
export function Hero() {
  return (
    <section className="border-b border-border">
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-8 p-6 lg:gap-10 lg:px-12 lg:py-20">
          <div className="flex flex-col gap-4">
            <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance">
              From AI-Generated Code to Production Software
            </h1>
            <p className="text-muted-foreground text-copy-18 sm:text-copy-20 leading-7 max-w-xl text-balance [&:not(:first-child)]:mt-0">
              {PLAYBOOK_LEAD}
            </p>
          </div>
          <Form />
        </div>
        <div className="flex items-center justify-center p-6 lg:py-20 lg:pl-12">
          {/* TODO(v0.2): replace this placeholder with the real cover
              image (`apps/web/public/playbook/cover.png` linked via
              next/image). Sized to match the column (~288px) and the
              PDF aspect ratio (~3:4). */}
          <div
            aria-label="Playbook cover, placeholder until the real PDF lands"
            className="flex h-[420px] w-72 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-center text-label-13 text-muted-foreground"
          >
            Cover TODO
          </div>
        </div>
      </div>
    </section>
  )
}
