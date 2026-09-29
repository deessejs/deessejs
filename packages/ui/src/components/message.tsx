import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Row wrapper for a single message in a chat conversation.
 *
 * Verified against the official shadcn source (June 2026). No CVA —
 * the file ships plain `cn` class strings. The shell sets
 * `group/message` so descendants can match `group-data-[align=end]/message:...`
 * (Bubble flips via this selector, MessageContent children align to
 * the end via `*:data-slot:self-end`).
 *
 * Alignment is driven by `data-[align=end]:flex-row-reverse` on the
 * Message shell — a single CSS rule replaces the two-variant CVA
 * shadcn moved off 4 years ago.
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
 */
function MessageGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-group"
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    />
  )
}

interface MessageProps extends React.ComponentProps<"div"> {
  /** `start` puts the avatar on the left (assistant), `end` flips via `flex-row-reverse` (user). */
  align?: "start" | "end"
}

function Message({
  className,
  align = "start",
  ...props
}: MessageProps) {
  return (
    <div
      data-slot="message"
      data-align={align}
      className={cn(
        "group/message relative flex w-full min-w-0 gap-2 text-sm data-[align=end]:flex-row-reverse",
        className,
      )}
      {...props}
    />
  )
}

function MessageAvatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-avatar"
      className={cn(
        "flex w-fit min-w-8 shrink-0 items-center justify-center self-end overflow-hidden rounded-full bg-muted group-has-data-[slot=message-footer]/message:-translate-y-8",
        className,
      )}
      {...props}
    />
  )
}

function MessageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-content"
      className={cn(
        "flex w-full min-w-0 flex-col gap-2.5 wrap-break-word group-data-[align=end]/message:*:data-slot:self-end",
        className,
      )}
      {...props}
    />
  )
}

function MessageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-header"
      className={cn(
        "flex max-w-full min-w-0 items-center px-3 text-xs font-medium text-muted-foreground group-has-data-[variant=ghost]/message:px-0",
        className,
      )}
      {...props}
    />
  )
}

function MessageFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-footer"
      className={cn(
        "flex max-w-full min-w-0 items-center px-3 text-xs font-medium text-muted-foreground group-has-data-[variant=ghost]/message:px-0 group-data-[align=end]/message:justify-end",
        className,
      )}
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
}