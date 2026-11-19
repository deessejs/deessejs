"use client"

import { useSearchDialogStore } from "@/lib/search/store"
import { useSearchShortcuts } from "@/hooks/search/use-search-shortcuts"

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

  useSearchShortcuts(toggle, close)

  return null
}
