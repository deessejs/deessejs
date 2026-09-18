"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type Props = {
  text: string
  className?: string
}

/**
 * Tiny client component that copies `text` to the clipboard on
 * click and toggles a checkmark for 1.5s as feedback. Used in the
 * Code tab of the component leaf pages.
 */
export function CopyButton({ text, className }: Props) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable (e.g. insecure context); fail
      // silently. The fallback UX is the user can still select
      // and copy manually.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleClick}
      aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
      className={cn("shrink-0", className)}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </Button>
  )
}