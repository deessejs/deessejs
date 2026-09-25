import { CHANNELS } from "@/lib/about/channels"

/**
 * /about — "Get in touch" section.
 *
 * Same recipe as MainApp / Editor: 2-col grid on lg+ with
 * title in the left cell, content in the right cell. Section
 * owns its `border-b border-border` and `py-16 px-4 md:px-6
 * md:py-20 lg:py-24` padding.
 *
 * Last section before the RelatedLinks + FinalCta block, so
 * no `border-b` — the next border belongs to the RelatedLinks
 * wrapper in the route page.
 *
 * Lead paragraph + 1×3 grid (mobile: stacked, tablet: 3-col)
 * of contact channel cards. Each card is an `<a>` (external
 * anchor or mailto:) with a label + body. The `href` prefix
 * decides whether `target="_blank"` is added.
 */
export function Contact() {
  return (
    <section className="grid grid-cols-1 gap-8 border-b border-border py-16 md:py-20 lg:py-24 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <h2 className="text-heading-24 tracking-tight text-foreground lg:pt-1">
        Get in touch
      </h2>
      <div className="space-y-4">
        <p className="max-w-3xl text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          Three channels, by purpose. Pick the one that matches
          what you&apos;re bringing.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {CHANNELS.map((channel) => (
            <a
              key={channel.label}
              href={channel.href}
              target={
                channel.href.startsWith("http") ? "_blank" : undefined
              }
              rel={
                channel.href.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
              className="flex h-full flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
            >
              <span className="text-label-14 font-semibold tracking-tight text-foreground">
                {channel.label}
              </span>
              <span className="text-copy-13 text-muted-foreground leading-5 [&:not(:first-child)]:mt-0">
                {channel.body}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
