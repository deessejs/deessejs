import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Chat-style message surface — shadcn base primitive (June 2026).
 *
 * Verified against the official shadcn source verbatim:
 * - Bubble is a layout wrapper only (`group/bubble`); the actual surface
 *   styling (bg / text / border / rounded) lives on `BubbleContent`.
 *   This separation lets BubbleContent be re-rendered as a `<button>`
 *   or `<a>` via the `asChild` Slot without losing its styling.
 * - Alignment is driven by the parent `Message` component via the
 *   `group/message` + `data-align` contract. `Bubble` inherits the
 *   alignment through `group-data-[align=end]/message:self-end`.
 *   `Bubble` itself takes no `align` prop.
 * - Variants cascade into `BubbleContent` via the `data-slot` selector
 *   (`*:data-[slot=bubble-content]:bg-primary`). Selecting the child
 *   slot, not Bubble itself, means the variant switch happens at the
 *   painted surface (the content), not at the layout shell.
 * - BubbleReactions is absolutely positioned inside Bubble — the
 *   `side` (`top` / `bottom`) and `align` (`start` / `end`) props
 *   position a pill of reactions next to the bubble's edge.
 *
 * Token mapping (verified against `globals.css`):
 *   - default     : bg-primary / text-primary-foreground
 *   - secondary   : bg-secondary / text-secondary-foreground
 *   - muted       : bg-muted
 *   - tinted      : bg-primary/10 (light) / bg-primary/15 (dark)
 *   - outline     : border-border + bg-background
 *   - ghost       : bg-transparent (no border, no rounded, no padding)
 *   - destructive : bg-destructive/10 (light) / bg-destructive/20 (dark)
 */
const bubbleVariants = cva(
  "group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-1 group-data-[align=end]/message:self-end data-[align=end]:self-end data-[variant=ghost]:max-w-full",
  {
    variants: {
      variant: {
        default:
          "*:data-[slot=bubble-content]:bg-primary *:data-[slot=bubble-content]:text-primary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/80",
        secondary:
          "*:data-[slot=bubble-content]:bg-secondary *:data-[slot=bubble-content]:text-secondary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
        muted:
          "*:data-[slot=bubble-content]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]",
        tinted:
          "*:data-[slot=bubble-content]:bg-primary/10 *:data-[slot=bubble-content]:text-foreground dark:*:data-[slot=bubble-content]:bg-primary/15 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/20 dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/25",
        outline:
          "*:data-[slot=bubble-content]:border-border *:data-[slot=bubble-content]:bg-background [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-input/30",
        ghost:
          "border-none *:data-[slot=bubble-content]:rounded-none *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted/50",
        destructive:
          "*:data-[slot=bubble-content]:bg-destructive/10 *:data-[slot=bubble-content]:text-destructive dark:*:data-[slot=bubble-content]:bg-destructive/20 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/20 dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BubbleProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof bubbleVariants> {}

function Bubble({ variant = "default", className, ...props }: BubbleProps) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant}
      className={cn(bubbleVariants({ variant }), className)}
      {...props}
    />
  )
}

interface BubbleContentProps extends React.ComponentProps<"div"> {
  /**
   * When true, BubbleContent forwards its styling to a single child
   * element via `radix-ui` Slot. Use to render the message body as a
   * `<button>` or `<a>` while keeping the bubble chrome.
   */
  asChild?: boolean
}

function BubbleContent({
  asChild = false,
  className,
  ...props
}: BubbleContentProps) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-slot="bubble-content"
      className={cn(
        "w-fit max-w-full min-w-0 overflow-hidden rounded-xl border border-transparent px-3 py-2 text-sm leading-relaxed wrap-break-word group-data-[align=end]/bubble:self-end [button]:text-left [button,a]:transition-colors [button,a]:outline-none [button,a]:focus-visible:border-ring [button,a]:focus-visible:ring-3 [button,a]:focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  )
}

const bubbleReactionsVariants = cva(
  "absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full bg-muted px-1.5 py-0.5 ring-3 ring-card has-[button]:p-0",
  {
    variants: {
      side: {
        top: "top-0 -translate-y-3/4",
        bottom: "bottom-0 translate-y-3/4",
      },
      align: {
        start: "left-3",
        end: "right-3",
      },
    },
    defaultVariants: {
      side: "bottom",
      align: "end",
    },
  },
)

interface BubbleReactionsProps extends React.ComponentProps<"div"> {
  /** Position the reactions pill above or below the bubble edge. */
  side?: "top" | "bottom"
  /** Pin the pill to the start or end of the bubble edge. */
  align?: "start" | "end"
}

function BubbleReactions({
  side = "bottom",
  align = "end",
  className,
  ...props
}: BubbleReactionsProps) {
  return (
    <div
      data-slot="bubble-reactions"
      data-align={align}
      data-side={side}
      className={cn(bubbleReactionsVariants({ side, align }), className)}
      {...props}
    />
  )
}

function BubbleGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-group"
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    />
  )
}

export {
  Bubble,
  BubbleContent,
  BubbleReactions,
  BubbleGroup,
  bubbleVariants,
}