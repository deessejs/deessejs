"use client"

import { useEffect, type Dispatch, type SetStateAction } from "react"

type Tech = { name: string; logo: string }
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
function slotUpdater(slot: number): (current: ReadonlyArray<Tech>) => ReadonlyArray<Tech> {
  return (current) => swapAt(current, slot, pickDifferentIndex(current.length, slot))
}

export function useTechStackRotation(techs: ReadonlyArray<Tech>, reducedMotion: boolean, setOrder: Dispatch<SetStateAction<ReadonlyArray<Tech>>>) {
  useEffect(() => {
    if (reducedMotion || techs.length < 2) return
    const timeouts: number[] = []
    const armSlot = (slot: number) => {
      const id = window.setTimeout(() => {
        setOrder(slotUpdater(slot))
        armSlot(slot)
      }, randomCycleMs())
      timeouts.push(id)
    }
    for (let slot = 0; slot < techs.length; slot++) armSlot(slot)
    return () => timeouts.forEach(window.clearTimeout)
  }, [techs, reducedMotion, setOrder])
}
