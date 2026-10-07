"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

/**
 * A pill that displays a shell command and copies it to the clipboard on click.
 * Pure visual feedback ("Copied" + check icon) for 1.5s after a successful copy.
 *
 * The component owns its own focus and click handling. It does not steal focus
 * from the surrounding page on mount.
 */
export function CopyCommand({
  command,
  className,
}: {
  command: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard write can fail (insecure context, permission denied, no API).
      // Fall back to a deprecated-but-supported API.
      const el = document.createElement("textarea")
      el.value = command
      el.style.position = "fixed"
      el.style.opacity = "0"
      document.body.appendChild(el)
      el.select()
      try {
        document.execCommand("copy")
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      } catch {
        // Give up silently: the command is still visible and selectable.
      } finally {
        document.body.removeChild(el)
      }
    }
  }

  return (
    <Button
      type="button"
      onClick={onCopy}
      aria-label={copied ? "Command copied to clipboard" : "Copy command to clipboard"}
      className={cn(
        "group inline-flex h-auto items-center gap-3 rounded-none border border-border bg-background px-4 py-2.5 text-copy-13-mono text-foreground transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <span className="text-muted-foreground/60 select-none" aria-hidden>
        $
      </span>
      <span className="whitespace-nowrap">{command}</span>
      <span
        aria-hidden
        className="ml-2 inline-flex size-4 items-center justify-center text-muted-foreground transition-colors group-hover:text-foreground"
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-600" strokeWidth={3} />
        ) : (
          <Copy className="size-3.5" />
        )}
      </span>
    </Button>
  )
}
