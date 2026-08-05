"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export type CopyButtonProps = {
  value: string
  className?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  label?: string
  /** Optional accessible label override for the button itself. */
  ariaLabel?: string
}

/**
 * Tiny client component that copies `value` to the clipboard on click
 * and toggles an icon between Copy / Check for ~1.5s after success.
 *
 * Used on the templates detail page to surface "deessejs init <slug>"
 * as a one-click copy. Falls back gracefully when the Clipboard API
 * isn't available (older browsers, insecure contexts).
 */
export const CopyButton = ({
  value,
  className,
  variant = "outline",
  size = "sm",
  label,
  ariaLabel = "Copy to clipboard",
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable — no-op; the value is still
      // visible on the page so users can select/copy manually.
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      aria-label={ariaLabel}
      className={cn("gap-1.5", className)}
    >
      {label ? <span>{label}</span> : null}
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </Button>
  )
}