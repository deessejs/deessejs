"use client"

import { useEffect, useState } from "react"

export function useTypewriter(text: string, startMs: number, speedMs: number, mask = false, onComplete?: () => void) {
  const [shown, setShown] = useState("")
  useEffect(() => {
    let cancelled = false
    let timer: number | undefined
    const tick = (index: number) => {
      if (cancelled) return
      setShown(mask ? "•".repeat(index) : text.slice(0, index))
      if (index < text.length) timer = window.setTimeout(() => tick(index + 1), speedMs)
      else if (onComplete) timer = window.setTimeout(onComplete, 400)
    }
    timer = window.setTimeout(() => tick(1), startMs)
    return () => { cancelled = true; if (timer !== undefined) window.clearTimeout(timer) }
  }, [text, startMs, speedMs, mask, onComplete])
  return shown
}
