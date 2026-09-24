import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Final CTA — the closing 2-col shared-border block that appears
 * at the end of every public page.
 *
 * Pure presentational shell. Every page supplies its own copy via
 * props, so the wording can stay tuned to the page's promise
 * (e.g. /pricing sells the CLI, /enterprise sells the engagement,
 * /blog reads more) without leaking that copy into every other
 * page. The shell (border, padding, grid, button styles) lives
 * here so the visual stays consistent and any future change
 * (e.g. a different background tint, a different action button
 * style) is one file.
 *
 * Located in `pages/_shared/` so it isn't part of any page
 * namespace's exported surface. Each namespace's `FinalCta`
 * component still exists and just delegates to this shell with
 * the page-specific props hard-coded.
 */
export type FinalCtaAction = {
  label: string
  href: string
  /**
   * Visual variant of the button. Maps to the `<Button>` variant
   * API from `@workspace/ui/components/button`. Defaults to
   * `"default"` (primary).
   */
  variant?: "default" | "outline" | "ghost"
  /**
   * If true, renders an arrow icon after the label, matching the
   * primary CTA convention used on the homepage and `/pricing`.
   */
  withArrow?: boolean
}

export type FinalCtaProps = {
  /** Short uppercase eyebrow rendered above the title. */
  eyebrow: string
  /** Section title (the H2). */
  title: string
  /** Optional supporting body copy under the title. */
  body?: string
  /** One to three actions, stacked vertically on the right cell. */
  actions: ReadonlyArray<FinalCtaAction>
  /**
   * Drop the bottom border. Use this on the last section of the
   * page so the `GlobalLayout` outline closes the page cleanly.
   */
  noBorderB?: boolean
}

export function FinalCta({
  eyebrow,
  title,
  body,
  actions,
  noBorderB = false,
}: FinalCtaProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-2 divide-y border-t divide-border lg:divide-y-0 lg:divide-x",
        noBorderB ? "border-b-0" : "border-b border-border",
      )}
    >
      <div className="flex flex-col gap-4 p-6 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
          {title}
        </h2>
        {body ? (
          <p className="text-copy-16 text-muted-foreground leading-7 max-w-xl [&:not(:first-child)]:mt-0">
            {body}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-stretch justify-center gap-4 p-6 lg:p-10">
        {actions.map((action) => (
          <Button
            key={`${action.label}-${action.href}`}
            asChild
            size="lg"
            variant={action.variant ?? "default"}
          >
            <Link href={action.href}>
              {action.label}
              {action.withArrow ? (
                <ChevronRight className="size-3.5" aria-hidden />
              ) : null}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
