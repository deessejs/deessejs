"use client"

import { useEffect } from "react"
import { useSearchDialogStore } from "@/lib/search/store"

/**
 * Global keyboard shortcut for the search dialog.
 *
 * Cmd+K (macOS) / Ctrl+K (Windows, Linux) toggles the dialog.
 * The handler lives at the root layout level so the shortcut
 * works on every page.
 */
export function GlobalSearchShortcut() {
  const toggle = useSearchDialogStore((s) => s.toggle)
  const close = useSearchDialogStore((s) => s.close)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        toggle()
      } else if (e.key === "Escape") {
        close()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [toggle, close])

  return null
}