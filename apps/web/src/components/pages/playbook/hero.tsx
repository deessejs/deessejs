import Image from "next/image"

import { Form } from "./form"
import { PLAYBOOK_LEAD } from "./content/toc"

/**
 * The playbook cover mockup. The shipped file is cropped tight to
 * the book at 829x1118 (a 0.742 portrait ratio), so the wrapper
 * below pairs `aspect-[829/1118]` with `fill` to reserve the exact
 * height before the image loads. Its background is transparent, so
 * it needs no light plate to stay legible in the dark theme.
 */
const COVER = {
  src: "/playbook/cover.png",
  alt: "Playbook cover: From AI-Generated Code to Production Software",
}

/**
 * /playbook hero. First screen, two-column layout.
 *
 * Layout:
 *   ┌─ Left column ──────────────────┬─ Right column ───────────┐
 *   │ H1                             │                          │
 *   │ Lead                           │   Cover (mockup)         │
 *   │ Email input + submit button    │                          │
 *   │ Consent checkbox + privacy    │                          │
 *   └─────────────────────────────────┴──────────────────────────┘
 *
 * On `lg+` the two columns sit side by side with no divider
 * between them, separated only by their own gutters, and align
 * centrally. On mobile the cover stacks below the form.
 *
 * Title and lead copy, the email field, the inline submit, and the
 * optional consent checkbox all live in the left column. The form
 * repeats on this page only (it does not duplicate in the FinalCta
 * that closes the page).
 *
 * The right column holds the real cover mockup. Its background is
 * transparent, so it needs no light plate and reads correctly under
 * both themes, including the dark one (`html.dark`, set by
 * next-themes). The asset lives at
 * `apps/web/public/playbook/cover.png`.
 */
export function Hero() {
  return (
    <section className="border-b border-border">
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-8 p-6 lg:gap-10 lg:px-12 lg:py-20">
          <div className="flex flex-col gap-4">
            <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance">
              From AI-Generated Code to Production Software
            </h1>
            <p className="text-muted-foreground text-copy-18 sm:text-copy-20 leading-7 max-w-xl text-balance [&:not(:first-child)]:mt-0">
              {PLAYBOOK_LEAD}
            </p>
          </div>
          <Form inlineSubmit />
        </div>
        <div className="flex items-center justify-center p-6 lg:py-20 lg:pl-12">
          <div className="relative aspect-[829/1118] w-full max-w-[300px] sm:max-w-[340px] lg:max-w-[380px]">
            <Image
              src={COVER.src}
              alt={COVER.alt}
              fill
              sizes="(max-width: 640px) 300px, (max-width: 1024px) 340px, 380px"
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
