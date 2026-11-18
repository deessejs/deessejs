"use client"

import { useEffect, useState } from "react"

function randomCycleMs() { return 7000 + Math.floor(Math.random() * 5000) }
function swapAt<T>(input: ReadonlyArray<T>, i: number, j: number): T[] {
  const next = input.slice()
  if (i === j) return next
  const left = next[i]
  const right = next[j]
  if (left !== undefined && right !== undefined) { next[i] = right; next[j] = left }
  return next
}
function pickDifferentIndex(length: number, exclude: number) {
  if (length < 2) return exclude
  let pick = Math.floor(Math.random() * length)
  let attempts = 0
  while (pick === exclude && attempts < 10) {
    pick = Math.floor(Math.random() * length)
    attempts++
  }
  return pick
}
function slotUpdater(slot: number, techCount: number): (current: ReadonlyArray<number>) => ReadonlyArray<number> {
  return (current) => {
    const slots = current.length === techCount
      ? current
      : Array.from({ length: techCount }, (_, index) => index)
    return swapAt(slots, slot, pickDifferentIndex(slots.length, slot))
  }
}
export function useTechStackRotation(techCount: number, reducedMotion: boolean) {
  const [order, setOrder] = useState<ReadonlyArray<number>>([])
  useEffect(() => {
    if (reducedMotion || techCount < 2) return
    const timers = new Map<number, number>()
    const armSlot = (slot: number) => {
      const id = window.setTimeout(() => {
        timers.delete(slot)
        setOrder(slotUpdater(slot, techCount))
        armSlot(slot)
      }, randomCycleMs())
      timers.set(slot, id)
    }
    for (let slot = 0; slot < techCount; slot++) armSlot(slot)
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [techCount, reducedMotion])

  return order.length === techCount
    ? order
    : Array.from({ length: techCount }, (_, index) => index)
}
