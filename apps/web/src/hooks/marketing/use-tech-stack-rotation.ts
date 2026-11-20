"use client"

import { useEffect, useReducer, useState, type Dispatch } from "react"

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
type RotationAction = { slot: number; techCount: number }

function reduceRotationOrder(
  current: ReadonlyArray<number>,
  { slot, techCount }: RotationAction,
): ReadonlyArray<number> {
  const slots = current.length === techCount
    ? current
    : Array.from({ length: techCount }, (_, index) => index)
  return swapAt(slots, slot, pickDifferentIndex(slots.length, slot))
}

export type RotateTechStackSlot = Dispatch<RotationAction>

export function useTechStackRotation(techCount: number) {
  const initialOrder: ReadonlyArray<number> = []
  const [order, rotateSlot] = useReducer(reduceRotationOrder, initialOrder)

  return {
    order: order.length === techCount
      ? order
      : Array.from({ length: techCount }, (_, index) => index),
    rotateSlot,
  }
}

export function useTechStackRotationTimer(
  slot: number,
  techCount: number,
  reducedMotion: boolean,
  rotateSlot: RotateTechStackSlot,
) {
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (reducedMotion || techCount < 2) return
    const timer = setTimeout(() => {
      rotateSlot({ slot, techCount })
      setCycle((current) => current + 1)
    }, randomCycleMs())
    return () => clearTimeout(timer)
  }, [cycle, reducedMotion, rotateSlot, slot, techCount])
}
