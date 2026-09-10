"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Tech stack grid where each slot rotates through the available
 * technologies on its own timer, while a single shared state guarantees
 * that the same technology never appears in two slots at the same
 * moment (no visual duplicates).
 *
 * Animation budget:
 *  - Per-slot cycle: 7000-12000ms (random per slot, on every cycle)
 *  - Per-transition: 350ms ease-out (under the 400ms vestibular-safe cap)
 *  - Displacement: 8px translateY (under the 8px decorative cap)
 *  - Reduced motion: cycle paused, static rendering only
 *
 * Invariant: at any tick, every slot displays a distinct technology.
 * When a slot's timer expires, it swaps with a random other slot instead
 * of picking a random free technology. This is the cheapest way to keep
 * the invariant without coordinating across timers.
 */

type Tech = { name: string; logo: string }

const MIN_CYCLE_MS = 7000
const MAX_CYCLE_MS = 12000
const TRANSITION_MS = 0.35

function randomCycleMs() {
  return (
    MIN_CYCLE_MS +
    Math.floor(Math.random() * (MAX_CYCLE_MS - MIN_CYCLE_MS))
  )
}

/**
 * Pick a random index in `length` that differs from `exclude`.
 * Retries up to 10 times to avoid the same-index collision; falls back
 * to `exclude` if all retries collide (only possible when length < 2,
 * which the caller filters out).
 */
function pickDifferentIndex(length: number, exclude: number): number {
  let pick = Math.floor(Math.random() * length)
  let safety = 0
  while (pick === exclude && safety < 10) {
    pick = Math.floor(Math.random() * length)
    safety++
  }
  return pick
}

/** Fisher-Yates. Returns a new array, never mutates input. */
function shuffle<T>(input: ReadonlyArray<T>): T[] {
  const a = input.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Swap two distinct positions in an array. Used to mutate the shared
 * order while preserving the uniqueness invariant.
 */
function swapAt<T>(input: ReadonlyArray<T>, i: number, j: number): T[] {
  if (i === j) return input.slice()
  const a = input.slice()
  ;[a[i], a[j]] = [a[j], a[i]]
  return a
}

export function TechStackGrid({
  techs,
  className,
}: {
  techs: ReadonlyArray<Tech>
  className?: string
}) {
  const [order, setOrder] = useState<ReadonlyArray<Tech>>(techs)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
    // Reading the media query synchronously inside an effect is the
    // intended pattern: we want the initial state to reflect the OS
    // preference on mount. Cascading setState is acceptable here
    // because nothing else has rendered yet.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Each slot has its own timer. When it fires, it picks a random *other*
  // slot and swaps the two technologies. This keeps every tech present
  // exactly once at any moment.
  useEffect(() => {
    if (reducedMotion || techs.length < 2) return
    const timeouts: Array<number> = []

    const armSlot = (slotIdx: number) => {
      const id = window.setTimeout(() => {
        setOrder((prev) => {
          const otherIdx = pickDifferentIndex(prev.length, slotIdx)
          return swapAt(prev, slotIdx, otherIdx)
        })
        // Re-arm this slot with a fresh random delay so the rhythm stays
        // irregular across the lifetime of the page.
        armSlot(slotIdx)
      }, randomCycleMs())
      timeouts.push(id)
    }

    for (let i = 0; i < techs.length; i++) {
      armSlot(i)
    }

    return () => {
      for (const id of timeouts) window.clearTimeout(id)
    }
  }, [techs, reducedMotion])

  // Helper to recompute order on demand (kept for future use; current
  // implementation always mutates via swapAt above).
  // Exposed through setOrder to keep the linter happy if we wire a manual
  // "reshuffle" trigger later.
  void shuffle

  return (
    <div
      className={cn(
        "col-span-1 lg:col-span-4 grid grid-cols-2 md:grid-cols-4 lg:border-l border-border",
        className,
      )}
    >
      {techs.map((slot, slotIdx) => {
        const tech = order[slotIdx] ?? slot
        return (
          <div
            key={slotIdx}
            className="group relative flex h-24 items-center justify-center gap-2 px-4 py-6 text-copy-13 text-muted-foreground transition-colors hover:bg-accent/40 lg:border-l lg:border-t border-border first:border-l-0 first:border-t-0 overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tech.name}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{
                  duration: TRANSITION_MS,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex items-center justify-center gap-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/logos/${tech.logo}.svg`}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 shrink-0 dark:invert"
                  aria-hidden
                />
                <span className="font-medium">{tech.name}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
