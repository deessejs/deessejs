import { Form } from "./form"
import { PLAYBOOK_LEAD } from "./content/toc"

/**
 * /playbook hero — first screen.
 *
 * Centered column matching the recipe used by /pricing and /enterprise:
 * outer `flex flex-col items-center gap-8 border-b border-border px-6
 * py-16 text-center sm:py-20 lg:py-24`, inner `max-w-3xl` column.
 *
 * The H1 carries the real playbook title. The lead re-states the audience
 * and scope (not the transformation promise, which the H1 already
 * frames). Email form lives directly under the lead so the CTA is
 * visible above the fold on mobile (360px) and desktop.
 *
 * Placeholders stay honest:
 *   - Cover thumbnail is a labeled placeholder block until the real PDF
 *     cover lands at `apps/web/public/playbook/cover.{png|svg}`. A
 *     `TODO(v0.2)` comment marks the spot so the swap is obvious.
 *   - The form hits the real `/playbook` orpc route immediately — no
 *     fake submit, no demo state.
 */
export function Hero() {
  return (
    <section className="flex flex-col items-center gap-8 border-b border-border px-6 py-16 text-center sm:py-20 lg:py-24">
      <div className="flex max-w-3xl flex-col items-center gap-6">
        <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance">
          From AI-Generated Code to Production Software
        </h1>
        <p className="text-muted-foreground text-copy-18 sm:text-copy-20 leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0">
          {PLAYBOOK_LEAD}
        </p>
        {/* TODO(v0.2): replace this placeholder with the real cover
            image — `apps/web/public/playbook/cover.png` linked via
            next/image. Sized to match the column (max-w-3xl) and the
            PDF aspect ratio (~3:4). */}
        <div
          aria-label="Playbook cover — placeholder until the real PDF lands"
          className="flex h-72 w-48 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-center text-label-13 text-muted-foreground"
        >
          Cover — TODO
        </div>
        <Form />
      </div>
    </section>
  )
}
