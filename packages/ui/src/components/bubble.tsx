import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Chat-style message surface.
 *
 * Ports the shadcn `Bubble` primitive (released June 2026) to the
 * project's design system. Surfaces conversational content with a
 * variant + align contract. Sizes to 80% of its container by default;
 * the `ghost` variant escapes that clamp so long assistant text can
 * span the full row.
 *
 * Roles are conveyed visually by `align` (start = receiver/assistant,
 * end = sender/user) and the surrounding `Message` wrapper — not by
 * Bubble itself. Avatars, names, timestamps, and tool-call chrome
 * belong on `Message`, not here.
 *
 * No streaming or loading state — Bubble is intentionally scoped to
 * the bubble surface. Pair with a streaming caret span when needed.
 *
 * Variant token mapping (all tokens ship in `globals.css`):
 *   - default     : bg-primary / text-primary-foreground
 *   - secondary   : bg-secondary / text-secondary-foreground
 *   - muted       : bg-muted / text-muted-foreground
 *   - tinted      : bg-primary/10 + ring-primary/10
 *   - outline     : border-border + bg-background
 *   - ghost       : transparent, full-width
 *   - destructive : bg-destructive / text-destructive-foreground
 */
const bubbleVariants = cva(
  "relative w-full max-w-[80%] rounded-xl px-4 py-2 text-sm data-[variant=ghost]:max-w-none data-[variant=ghost]:bg-transparent data-[variant=ghost]:p-0 data-[align=start]:mr-auto data-[align=end]:ml-auto",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        muted: "bg-muted text-muted-foreground",
        tinted: "bg-primary/10 text-foreground ring-1 ring-primary/10",
        outline: "border border-border bg-background text-foreground",
        ghost: "bg-transparent text-foreground",
        destructive: "bg-destructive text-destructive-foreground",
      },
      align: {
        start: "mr-auto",
        end: "ml-auto",
      },
    },
    defaultVariants: {
      variant: "default",
      align: "start",
    },
  },
)

export interface BubbleProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof bubbleVariants> {}

function Bubble({ className, variant, align, ...props }: BubbleProps) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant}
      data-align={align}
      className={cn(bubbleVariants({ variant, align }), className)}
      {...props}
    />
  )
}

function BubbleContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-content"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

function BubbleReactions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-reactions"
      className={cn("mt-1 flex items-center gap-1", className)}
      {...props}
    />
  )
}

function BubbleGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-group"
      className={cn("flex flex-col gap-2", className)}
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