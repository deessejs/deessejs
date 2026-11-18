"use client"

import { useEffect, type Dispatch, type SetStateAction } from "react"

export function useCyclingDemo(activeIndex: number, reduceMotion: boolean, cycleMs: number, itemCount: number, setActiveIndex: Dispatch<SetStateAction<number>>, setProgress: Dispatch<SetStateAction<number>>) {
  useEffect(() => {
    if (reduceMotion) return
    const startedAt = performance.now()
    const interval = window.setInterval(() => {
      const progress = Math.min((performance.now() - startedAt) / cycleMs, 1)
      setProgress(progress)
      if (progress >= 1) {
        window.clearInterval(interval)
        setActiveIndex((index) => (index + 1) % itemCount)
      }
    }, 50)
    return () => window.clearInterval(interval)
  }, [activeIndex, reduceMotion, cycleMs, itemCount, setActiveIndex, setProgress])
}
