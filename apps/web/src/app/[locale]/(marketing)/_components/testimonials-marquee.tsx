import type { CSSProperties, ReactNode } from "react"

/**
 * Testimonials marquee — 12 placeholder quotes split into two
 * rows that scroll in opposite directions (top row right → left,
 * bottom row left → right via the `reverse` prop). Modelled on
 * the MagicUI Marquee component: CSS keyframe animation, content
 * duplicated for a seamless loop, edge fades on both sides, pause
 * on hover.
 *
 * The quotes are placeholder personas mapped to the four
 * archetypes in the home "Who it's for" section (indie hackers /
 * SaaS founders / enterprise / AI-native). They will be replaced
 * with real customer quotes as they come in.
 */

type Testimonial = {
  initials: string
  quote: string
  author: string
  role: string
}

const TESTIMONIALS: ReadonlyArray<Testimonial> = [
  // Indie hackers
  {
    initials: "MK",
    quote:
      "Deessejs init was running before my coffee finished brewing. By Friday I had a paying customer.",
    author: "Indie dev",
    role: "Solo founder",
  },
  {
    initials: "RJ",
    quote:
      "I shipped the MVP in a weekend instead of three months of plumbing.",
    author: "Bootstrapped founder",
    role: "SaaS side-project",
  },
  {
    initials: "AT",
    quote:
      "The contracts save me from re-learning auth every time I start a new project.",
    author: "Indie hacker",
    role: "Multiple SaaS",
  },
  // SaaS founders
  {
    initials: "LV",
    quote:
      "We skipped 10 weeks of infra on the first project. The second one was a copy-paste.",
    author: "Series A founder",
    role: "B2B SaaS",
  },
  {
    initials: "SC",
    quote:
      "Our agents extend the templates without breaking the contracts. That alone saved a quarter.",
    author: "Founder",
    role: "Dev tools SaaS",
  },
  {
    initials: "PD",
    quote:
      "The billing module alone is worth the price. We never want to write Stripe webhooks again.",
    author: "Co-founder",
    role: "Vertical SaaS",
  },
  // Enterprise teams
  {
    initials: "HN",
    quote:
      "We replaced our internal platform team for the first three services. They got to focus on what matters.",
    author: "Platform lead",
    role: "Fortune 500",
  },
  {
    initials: "EG",
    quote:
      "The contracts gave us an audit trail our compliance team stopped asking about.",
    author: "Engineering director",
    role: "Fintech",
  },
  {
    initials: "FT",
    quote:
      "Same templates, same guarantees as the vendors we were quoted $200k to build.",
    author: "CTO",
    role: "Regulated industry",
  },
  // AI-native teams
  {
    initials: "YR",
    quote:
      "Our agents navigate the registry like a developer would. They ship features overnight.",
    author: "AI tooling lead",
    role: "Startup",
  },
  {
    initials: "NB",
    quote:
      "The MCP layer is what we've been waiting for. Agents read the contracts and build on them.",
    author: "Founding engineer",
    role: "AI infra",
  },
  {
    initials: "KO",
    quote:
      "We deploy an agent in the morning, it scaffolds a service by lunch, and ships to staging by EOD.",
    author: "Head of AI",
    role: "Scale-up",
  },
]

function TestimonialCard({ t }: { t: Testimonial }): ReactNode {
  return (
    <figure className="flex w-72 shrink-0 flex-col gap-3 border border-border bg-background p-6">
      <blockquote className="text-copy-14 text-foreground leading-6 text-balance [&:not(:first-child)]:mt-0">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <figcaption className="flex items-center gap-3 pt-2">
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full border border-border bg-muted/40 text-label-12 text-foreground"
        >
          {t.initials}
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-label-13 text-foreground">{t.author}</span>
          <span className="text-label-12 text-muted-foreground">{t.role}</span>
        </span>
      </figcaption>
    </figure>
  )
}

/**
 * Marquee — single scrolling row. Modelled on MagicUI: CSS-driven
 * loop via the `--duration` custom property, `pauseOnHover` to
 * freeze on hover, `reverse` to flip the direction.
 */
function Marquee({
  children,
  pauseOnHover = false,
  reverse = false,
  className,
}: {
  children: ReactNode
  pauseOnHover?: boolean
  reverse?: boolean
  className?: string
}): ReactNode {
  const animationStyle: CSSProperties = {
    animation: "marquee var(--duration) infinite linear",
    ...(reverse ? { animationDirection: "reverse" } : {}),
    ...(pauseOnHover
      ? { animationPlayState: "var(--play-state, running)" }
      : {}),
  }
  return (
    <div
      className={cn(
        "flex w-max gap-[var(--gap)]",
        pauseOnHover && "group-hover:[animation-play-state:paused]",
        className,
      )}
      style={animationStyle}
      aria-hidden
    >
      {children}
    </div>
  )
}

// Inline minimal cn to avoid a useless import.
function cn(...classes: Array<string | false | undefined | null>): string {
  return classes.filter(Boolean).join(" ")
}

export function TestimonialsMarquee() {
  const firstRow = TESTIMONIALS.slice(0, 6)
  const secondRow = TESTIMONIALS.slice(6, 12)

  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden [--duration:60s] [--gap:1rem] py-6 space-y-4">
      <style>
        {`@keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-100% - var(--gap))); }
        }`}
      </style>
      <Marquee pauseOnHover>
        {[...firstRow, ...firstRow].map((t, i) => (
          <TestimonialCard key={`top-${t.initials}-${i}`} t={t} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover>
        {[...secondRow, ...secondRow].map((t, i) => (
          <TestimonialCard key={`bottom-${t.initials}-${i}`} t={t} />
        ))}
      </Marquee>
      <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r" />
      <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l" />
    </div>
  )
}
