"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Pill that displays a shell command and copies it to the clipboard on click.
 * Pure visual feedback ("Copied" + check icon) for 1.5s after a successful copy.
 *
 * Local to the use-cases tree — no cross-dependency on the marketing
 * homepage's _components, which keeps the pages self-contained.
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
      variant="outline"
      onClick={onCopy}
      aria-label={copied ? "Command copied to clipboard" : "Copy command to clipboard"}
      className={cn(
        "h-auto gap-3 rounded-lg px-4 py-2.5 font-mono text-copy-13-mono",
        className,
      )}
    >
      <span className="text-muted-foreground/60 select-none" aria-hidden>
        $
      </span>
      <span className="whitespace-nowrap">{command}</span>
      <span
        aria-hidden
        className="ml-2 inline-flex size-4 items-center justify-center text-muted-foreground transition-colors"
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
