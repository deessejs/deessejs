"use client"

import { useCallback, useState } from "react"
import { Check } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Copy-to-clipboard button used by the CLI section on the homepage.
 *
 * Built on top of the workspace <Button> (shadcn) to keep linting
 * aligned with the rest of the apps/web tree. The default `Button`
 * ships `rounded-lg`; we override it to `rounded-none` so the
 * control reads as part of the homepage shared-border chrome
 * instead of sticking out as a pill.
 *
 * State machine: idle → copied (1.5s) → idle. The label flips to
 * "Copied" and a check icon fades in. Falls back to a legacy
 * `document.execCommand("copy")` path when the async Clipboard API
 * is unavailable.
 */
export function CopyCommandButton({
  command,
  className,
}: {
  /** Exact string written to the clipboard on click. */
  command: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const onClick = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(command)
      } else {
        const el = document.createElement("textarea")
        el.value = command
        el.setAttribute("readonly", "")
        el.style.position = "absolute"
        el.style.left = "-9999px"
        document.body.appendChild(el)
        el.select()
        document.execCommand("copy")
        document.body.removeChild(el)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Silent failure: the user can still retype the command from
      // the visible panel. Avoids console noise in environments
      // where clipboard access is blocked (e.g. insecure contexts).
    }
  }, [command])

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      onClick={onClick}
      aria-label={copied ? "Command copied" : "Copy command to clipboard"}
      className={cn(
        "rounded-none border-border bg-background px-3 text-label-13 font-medium tracking-tight hover:bg-accent/40",
        className,
      )}
    >
      {copied ? <Check className="size-3" aria-hidden /> : null}
      {copied ? "Copied" : "Copy"}
    </Button>
  )
}
