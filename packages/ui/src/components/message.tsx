import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Row wrapper for a single message in a chat conversation.
 *
 * Ports the shadcn `Message` primitive (released June 2026) to the
 * project's design system. `align` drives row direction: `start` puts
 * the avatar on the left (assistant), `end` flips via
 * `flex-row-reverse` so the avatar lands on the right (user).
 *
 * Role is conveyed visually by `align` plus the avatar slot —
 * `Message` itself is presentational. Accessibility comes from the
 * inner content; `MessageHeader` is the canonical place for sender
 * names, `MessageFooter` for timestamps and actions.
 *
 * Composition:
 *   <Message>
 *     <MessageAvatar />
 *     <MessageContent>
 *       <MessageHeader />
 *       <Bubble />
 *       <MessageFooter />
 *     </MessageContent>
 *   </Message>
 *
 * `MessageAvatar` auto-hides when empty via the `[&:empty]:hidden`
 * selector — pass it on user rows where you don't render an avatar.
 */
const messageVariants = cva("flex items-start gap-3", {
  variants: {
    align: {
      start: "",
      end: "flex-row-reverse",
    },
  },
  defaultVariants: {
    align: "start",
  },
})

export interface MessageProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof messageVariants> {}

function Message({ className, align, ...props }: MessageProps) {
  return (
    <div
      data-slot="message"
      data-align={align}
      className={cn(messageVariants({ align }), className)}
      {...props}
    />
  )
}

function MessageGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-group"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

/**
 * Avatar slot anchored at the row's start or end depending on the
 * parent `Message` `align`. Renders empty by default — callers drop
 * in a dot, an `<Avatar>`, or leave it blank for asymmetric rows.
 * Auto-hidden when empty so user rows can omit the avatar entirely.
 */
function MessageAvatar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-avatar"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center [&:empty]:hidden",
        className,
      )}
      {...props}
    />
  )
}

function MessageContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-content"
      className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}
      {...props}
    />
  )
}

function MessageHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-header"
      className={cn(
        "text-label-12 uppercase tracking-wider text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

function MessageFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-footer"
      className={cn("text-label-12 text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Message,
  MessageGroup,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
  messageVariants,
}