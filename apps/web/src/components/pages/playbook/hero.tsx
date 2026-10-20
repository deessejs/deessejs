import Image from "next/image"

import { Form } from "./form"
import { PLAYBOOK_LEAD } from "./content/toc"

/**
 * The playbook cover mockup.
 *
 * `cover.png` is a 1500x1383 frame whose transparent margin holds
 * 47% of its width. The artwork (book plus drop shadow) occupies a
 * 797x1086 region starting at (346,134), read off the file's alpha
 * channel. Rendered whole, the book draws at roughly half the size
 * the layout asks for.
 *
 * The frame is cropped to that region in CSS rather than by
 * rewriting the asset, so `cover.png` stays byte-identical to what
 * was exported. The wrapper below is the artwork's own box; the
 * image is scaled so the artwork's width fills it, then slid so the
 * artwork's top-left corner sits at the wrapper's origin. Each
 * number falls out of those two measurements:
 *
 *   wrapper ratio   797/1086   the artwork's own proportions
 *   width  188.21%  = 1500/797 the frame is that much wider
 *   left   -43.41%  = -346/797 the artwork starts that far in
 *   top    -12.34%  = -(134/1383) of the frame's height, which
 *                    resolves against the wrapper's height
 *
 * The remaining margin is transparent, so the crop costs nothing
 * visually and the mockup needs no light plate to stay legible in
 * the dark theme. Re-measure with an alpha scan if the cover is
 * re-exported at different bounds.
 */
const COVER = {
  src: "/playbook/cover.png",
  alt: "Playbook cover: From AI-Generated Code to Production Software",
  frame: { width: 1500, height: 1383 },
  crop: {
    width: "188.21%",
    height: "auto",
    left: "-43.41%",
    top: "-12.34%",
  },
} as const

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
 * The right column holds the real cover mockup, cropped to the
 * artwork in CSS (see `COVER`). Its background is transparent, so
 * it needs no light plate and reads correctly under both themes,
 * including the dark one (`html.dark`, set by next-themes). The
 * asset lives at `apps/web/public/playbook/cover.png` and is
 * served exactly as exported.
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
          <div
            className="relative w-full overflow-hidden max-w-[300px] sm:max-w-[340px] lg:max-w-[380px]"
            style={{ aspectRatio: "797 / 1086" }}
          >
            <Image
              src={COVER.src}
              alt={COVER.alt}
              width={COVER.frame.width}
              height={COVER.frame.height}
              sizes="(max-width: 640px) 300px, (max-width: 1024px) 340px, 380px"
              className="absolute max-w-none"
              style={COVER.crop}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
