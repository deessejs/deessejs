"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import Fuse from "fuse.js"
import { searchData } from "@/lib/blog/search"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

export function SearchDialog() {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const fuse = useMemo(
    () =>
      new Fuse(searchData, {
        keys: [
          { name: "title", weight: 2 },
          { name: "description", weight: 1 },
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
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
      setIsOpen(false)
      setQuery("")
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 border border-border/40 bg-muted/30 px-3 py-1.5 text-muted-foreground hover:bg-muted/50"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline text-[10px] font-mono text-muted-foreground/60">
          ⌘K
        </kbd>
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => { setIsOpen(false); setQuery("") }}
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border/40 bg-card shadow-xl">
        <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search articles and releases..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-0 bg-transparent p-0 text-sm shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setIsOpen(false); setQuery("") }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        </div>

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
                      setIsOpen(false)
                      setQuery("")
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
            Start typing to search posts and releases
          </div>
        )}
      </div>
    </div>
  )
}
