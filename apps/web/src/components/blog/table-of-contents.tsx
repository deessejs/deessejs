"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { cn } from "@workspace/ui/lib/utils"

interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

function parseTocItems(serialized: string): TocItem[] {
  const parsed: unknown = JSON.parse(serialized)
  if (!Array.isArray(parsed)) return []
  return parsed.filter(isTocItem)
}

function isTocItem(item: unknown): item is TocItem {
  if (typeof item !== "object" || item === null) return false
  if (!("id" in item) || !("text" in item) || !("level" in item)) return false
  if (typeof item.id !== "string" || typeof item.text !== "string") return false
  return item.level === 2 || item.level === 3
}

export function TableOfContents({ targetId }: { targetId: string }) {
  const serializedItems = useSyncExternalStore(
    (onChange) => subscribeToHeadings(targetId, onChange),
    () => getSerializedHeadings(targetId),
    () => "[]"
  )
  const items = useMemo(() => parseTocItems(serializedItems), [serializedItems])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (items.length === 0) return

    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el))

    if (headings.length === 0) return

    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id)
          } else {
            visible.delete(entry.target.id)
          }
        }
        const ordered = items.map((i) => i.id).filter((id) => visible.has(id))
        setActiveId(ordered[0] ?? null)
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    )

    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [items, targetId])

  if (items.length === 0) return null

  return (
    <nav
      aria-label="Table of contents"
      className="sticky top-[calc(theme(spacing.14)+theme(spacing.6))] max-h-[calc(100dvh-calc(theme(spacing.14)+theme(spacing.8)))] overflow-y-auto"
    >
      <p className="mb-3 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        On this page
      </p>
      <ul className="space-y-1 border-l border-border/40">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "-ml-px block border-l py-1 pl-3 text-xs leading-relaxed transition-colors",
                item.level === 3 && "pl-6",
                activeId === item.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function getSerializedHeadings(targetId: string): string {
  const target = document.getElementById(targetId)
  if (!target) return "[]"

  const items: TocItem[] = Array.from(
    target.querySelectorAll<HTMLHeadingElement>("h2, h3")
  ).map((heading) => ({
    id: heading.id || slugify(heading.textContent || ""),
    text: heading.textContent || "",
    level: heading.tagName === "H3" ? 3 : 2,
  }))

  return JSON.stringify(items)
}

function subscribeToHeadings(targetId: string, onChange: () => void) {
  const target = document.getElementById(targetId)
  if (!target) return () => undefined

  target.querySelectorAll<HTMLHeadingElement>("h2, h3").forEach((heading) => {
    if (!heading.id) heading.id = slugify(heading.textContent || "")
  })

  const observer = new MutationObserver(onChange)
  observer.observe(target, {
    attributes: true,
    attributeFilter: ["id"],
    characterData: true,
    childList: true,
    subtree: true,
  })
  return () => observer.disconnect()
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}
