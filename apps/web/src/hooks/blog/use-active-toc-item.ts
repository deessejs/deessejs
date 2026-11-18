"use client"

import { useEffect, useState } from "react"

export function useActiveTocItem(items: ReadonlyArray<{ id: string }>) {
  const [activeId, setActiveId] = useState<string | null>(null)
  useEffect(() => {
    if (items.length === 0) return
    const headings = items.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => Boolean(el))
    if (headings.length === 0) return
    const visible = new Set<string>()
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id)
        else visible.delete(entry.target.id)
      }
      setActiveId(items.find((item) => visible.has(item.id))?.id ?? null)
    }, { rootMargin: "-15% 0px -70% 0px", threshold: 0 })
    headings.forEach((heading) => observer.observe(heading))
    return () => observer.disconnect()
  }, [items])
  return activeId
}
