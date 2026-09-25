import { CHANNELS } from "@/lib/about/channels"

/**
 * /about — "Get in touch" section.
 *
 * Lead paragraph + 1×3 grid (mobile: stacked) of contact channel
 * cards. Each card is an <a> (external/anchor) or a mailto: link
 * with a label + body. The href prefix decides whether target=_blank
 * is added.
 */
export function Contact() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-heading-24 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
        Get in touch
      </h2>
      <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
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
    </section>
  )
}
