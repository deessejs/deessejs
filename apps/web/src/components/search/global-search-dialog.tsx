"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import Fuse from "fuse.js"
import { searchData } from "@/lib/search/corpus"
import { useSearchDialogStore } from "@/lib/search/store"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog"

/**
 * Site-wide Cmd-K search dialog.
 *
 * Mounted once at the root layout. Visibility comes from the
 * Zustand store (`useSearchDialogStore`) so that the trigger
 * button (in the header), the keyboard shortcut, and any future
 * placeholder can all open the same dialog.
 *
 * Built on the shadcn Dialog primitive (Radix). The primitive
 * handles focus trap, focus return to the trigger, backdrop
 * click, and the Portal. We hide its default close button
 * (`showCloseButton = false`) because the input row already
 * carries an explicit X.
 */

export function GlobalSearchDialog() {
  const isOpen = useSearchDialogStore((s) => s.isOpen)
  const close = useSearchDialogStore((s) => s.close)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const fuse = useMemo(
    () =>
      new Fuse(searchData, {
        keys: [
          { name: "title", weight: 2 },
          { name: "description", weight: 1 },
          { name: "tags", weight: 1 },
        ],
        threshold: 0.3,
        includeScore: true,
        minMatchCharLength: 2,
      }),
    []
  )

  const results = useMemo(() => {
    if (!query.trim()) return []
    return fuse.search(query).slice(0, 8)
  }, [query, fuse])

  useEffect(() => {
    // Reset selection when results change (e.g., new search query)
    // This is intentional - we want to clear selection on new results
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(-1)
  }, [results])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    } else {
      // Reset state when the dialog closes so the next open starts fresh.
      // This is intentional - cascading render is fine here because close
      // is a user action, not a render-driven one.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("")
      setSelectedIndex(-1)
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      router.push(results[selectedIndex]!.item.url)
      close()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-w-lg flex-col gap-0 p-0 sm:max-w-lg"
      >
        <DialogTitle className="sr-only">Search the DeesseJS ecosystem</DialogTitle>
        <DialogDescription className="sr-only">
          Press Escape to close, arrow keys to navigate results,
          Enter to open the selected item.
        </DialogDescription>

        <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search the DeesseJS ecosystem..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search query"
            className="flex-1 border-0 bg-transparent p-0 text-sm shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => close()}
            aria-label="Close search"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Live region for screen readers: announces result count.
            Visually hidden (sr-only) but announces via aria-live. */}
        <span role="status" aria-live="polite" className="sr-only">
          {query.trim() === ""
            ? ""
            : results.length === 0
              ? `No results for ${query}`
              : `${results.length} ${results.length === 1 ? "result" : "results"} for ${query}`}
        </span>

        {query.trim() && (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                No results for &ldquo;{query}&rdquo;
              </li>
            ) : (
              results.map((result, i) => (
                <li key={result.item.url}>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      router.push(result.item.url)
                      close()
                    }}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 px-4 py-2 text-left",
                      selectedIndex === i
                        ? "bg-muted"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                          result.item.type === "post"
                            ? "bg-primary/10 text-primary"
                            : result.item.type === "kb-topic"
                              ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                              : result.item.type === "kb-guide"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {result.item.type}
                      </span>
                      <span className="text-sm font-medium">{result.item.title}</span>
                    </span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {result.item.description}
                    </span>
                  </Button>
                </li>
              ))
            )}
          </ul>
        )}

        {!query.trim() && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Start typing to search posts, releases, and KB topics
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}