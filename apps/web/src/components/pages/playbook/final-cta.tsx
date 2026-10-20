import { Form } from "./form"

/**
 * /playbook FinalCta. The page-closing block.
 *
 * Visually mirrors the shared `FinalCtaShell` recipe used by
 * /pricing, /about, /enterprise (2-col grid, eyebrow + H2 +
 * supporting body on the left, action area on the right,
 * bordered top and bottom). Modified for this page: the right
 * cell holds the email `<Form />` rather than a button list.
 * The closing message and the conversion CTA share the same
 * visual moment.
 *
 * The shared shell (`apps/web/src/components/pages/_shared/final-cta.tsx`)
 * renders a `actions: FinalCtaAction[]` slot; we deliberately do
 * NOT use it here because the playbook CTA is a form, not a list
 * of buttons. Promoting `<Form />` into a generic shape that the
 * shell accepts would couple a shared primitive to a single
 * caller's contract. Not worth it for one page.
 */
export function FinalCta() {
  return (
    <div className="grid grid-cols-1 border-y border-border lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x">
      <div className="flex flex-col gap-4 p-6 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Playbook
        </p>
        <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
          Get the playbook
        </h2>
        <p className="text-copy-16 text-muted-foreground leading-7 max-w-md text-balance [&:not(:first-child)]:mt-0">
          You&apos;ll get one email with the PDF. If you opt in to
          updates, you may also receive occasional messages about
          DeesseJS. Unsubscribe any time from the link at the
          bottom of any email we send.
        </p>
      </div>
      <div className="flex flex-col items-stretch justify-center gap-4 p-6 lg:p-10">
        <Form fullWidth inlineSubmit />
      </div>
    </div>
  )
}
