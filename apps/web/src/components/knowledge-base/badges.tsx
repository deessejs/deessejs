import { cn } from "@workspace/ui/lib/utils"

/**
 * Colored badges for the knowledge-base surfaces.
 *
 * 8-color palette + deterministic hash so the same tag renders
 * the same color everywhere — the visitor learns
 * color = tag. The hash is a tiny string hash, stable across
 * renders, deterministic for SSR (no Date.now / Math.random).
 *
 * The colors mirror the Tailwind palette and read well in both
 * light and dark modes (text-700 in light, text-400 in dark;
 * bg-500/10 for the tinted background; border-500/40 in light,
 * border-500/30 in dark for the rim).
 *
 * Plain `<span>` elements rather than the shadcn Badge primitive
 * because we want full control over the colors (the Badge variants
 * are too generic — `secondary` and `outline` give a single
 * monochrome look).
 */

const PALETTE = [
  { name: "rose",     bg: "bg-rose-500/10",     border: "border-rose-500/40",     text: "text-rose-700 dark:text-rose-400",     borderDark: "dark:border-rose-500/30" },
  { name: "amber",    bg: "bg-amber-500/10",    border: "border-amber-500/40",    text: "text-amber-700 dark:text-amber-400",    borderDark: "dark:border-amber-500/30" },
  { name: "emerald",  bg: "bg-emerald-500/10",  border: "border-emerald-500/40",  text: "text-emerald-700 dark:text-emerald-400",  borderDark: "dark:border-emerald-500/30" },
  { name: "sky",      bg: "bg-sky-500/10",      border: "border-sky-500/40",      text: "text-sky-700 dark:text-sky-400",      borderDark: "dark:border-sky-500/30" },
  { name: "violet",   bg: "bg-violet-500/10",   border: "border-violet-500/40",   text: "text-violet-700 dark:text-violet-400",   borderDark: "dark:border-violet-500/30" },
  { name: "fuchsia", bg: "bg-fuchsia-500/10",  border: "border-fuchsia-500/40",  text: "text-fuchsia-700 dark:text-fuchsia-400",  borderDark: "dark:border-fuchsia-500/30" },
  { name: "teal",     bg: "bg-teal-500/10",     border: "border-teal-500/40",     text: "text-teal-700 dark:text-teal-400",     borderDark: "dark:border-teal-500/30" },
  { name: "orange",   bg: "bg-orange-500/10",   border: "border-orange-500/40",   text: "text-orange-700 dark:text-orange-400",   borderDark: "dark:border-orange-500/30" },
] as const

/**
 * Tiny deterministic string hash. djb2 — no crypto requirement,
 * uniform enough for tag→color mapping. SSR-safe (no Date.now /
 * Math.random).
 */
function hashString(input: string): number {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function colorFor(input: string) {
  return PALETTE[hashString(input) % PALETTE.length]
}

const PILL_BASE =
  "inline-flex items-center rounded-none border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"

type PillProps = {
  children: React.ReactNode
  /** Override the deterministic color with a specific palette entry. */
  color?: string | undefined
  className?: string | undefined
}

/**
 * Generic colored pill. The text is hashed to pick a color from
 * the 8-color palette; the same string always picks the same
 * color. Pass `color` to force a specific palette entry (rare).
 */
export function ColoredPill({ children, color, className }: PillProps) {
  const text = typeof children === "string" ? children : ""
  const entry = color
    ? PALETTE.find((c) => c.name === color)
    : text
      ? colorFor(text)
      : PALETTE[0]
  if (!entry) return null

  return (
    <span
      className={cn(
        PILL_BASE,
        entry.bg,
        entry.border,
        entry.borderDark,
        entry.text,
        className,
      )}
    >
      {children}
    </span>
  )
}

export function TopicTagPill({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string | undefined
}) {
  return (
    <ColoredPill className={className}>{children}</ColoredPill>
  )
}

/**
 * Guide-product pill. Same color logic. The hash keys off the
 * product name; if the same product appears on multiple guides
 * (e.g., "postgres" on the agents topic guide AND on the
 * databases topic guide), it renders the same color in both —
 * the visitor learns color = tag, not color = guide.
 */
export function GuideProductPill({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string | undefined
}) {
  return (
    <ColoredPill className={className}>{children}</ColoredPill>
  )
}