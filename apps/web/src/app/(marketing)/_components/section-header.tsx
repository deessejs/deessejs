import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Shared-border section header: eyebrow + title + optional subtitle,
 * with an optional right-aligned action link.
 *
 * The vertical-bar eyebrow is the canonical "small section label" used
 * across the marketing surfaces (Surfaces, Latest guides, Ecosystem,
 * Testimonials). It is implemented as an absolutely-positioned bar +
 * mono uppercase label, matching the existing styling without
 * requiring a new design system token.
 *
 * Two variants are exposed via `bordered`:
 *   - `true` (default) adds `border-b border-border`, matching the
 *     section dividers in the shared-border grid.
 *   - `false` drops the bottom border for sections where the header
 *     flows directly into content (e.g. the Surfaces grid header
 *     which already sits inside a `border-b` parent).
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  bordered = true,
  className,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  action?: { href: string; label: string }
  bordered?: boolean
  className?: string
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 p-6 md:p-8 lg:p-10",
        bordered && "border-b border-border",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center">
          <div
            aria-hidden
            className="mr-4 shrink-0 w-[1.7px] h-[13.5px] bg-foreground"
          />
          <span className="font-mono uppercase text-[0.8125rem] leading-[1.2] text-foreground opacity-64 font-medium tracking-[-0.01em]">
            {eyebrow}
          </span>
        </div>
        {action ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1 text-label-13 text-foreground hover:underline underline-offset-4 shrink-0"
          >
            {action.label}
            <ChevronRight className="size-3" aria-hidden />
          </Link>
        ) : null}
      </div>
      <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-copy-16 text-muted-foreground leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
          {subtitle}
        </p>
      ) : null}
    </header>
  )
}
