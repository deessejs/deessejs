"use client"

import Image from "next/image"
import { useSyncExternalStore } from "react"
import { AnimatePresence, LazyMotion, domAnimation } from "motion/react"
import * as m from "motion/react-m"

import { cn } from "@workspace/ui/lib/utils"
import {
  useTechStackRotation,
  useTechStackRotationTimer,
  type RotateTechStackSlot,
} from "@/hooks/marketing/use-tech-stack-rotation"

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
 *
 * Layout:
 *  - Rules come from `gap-px` over a `bg-border` grid, not `divide-x`.
 *    A grid that wraps needs a rule on both axes, and `divide-x` only
 *    ever puts a border on every child but the last, so a two-row
 *    layout gets no horizontal rule at all plus a stray vertical one
 *    on the right edge of the first row only. A gap derives both axes
 *    from the same 1px and stays correct at any column count.
 *  - The column count is chosen so the widest label fits. Cloudflare
 *    measures 91px, plus a 20px logo, an 8px gap and `px-4` on both
 *    sides: 123px minimum per cell. The section is the viewport minus
 *    50px, so 8 columns need 1113px of viewport and 4 need 581px.
 *    `md` starts at 768px, which is why 8 columns only kick in at `xl`.
 *    Below `sm` two columns are the only count that fits: four would
 *    leave 89px per cell and clip both the logo and the label.
 */

type Tech = { name: string; logo: string }

const TRANSITION_MS = 0.35

function TechStackRotationTimer({
  slot,
  techCount,
  reducedMotion,
  rotateSlot,
}: {
  slot: number
  techCount: number
  reducedMotion: boolean
  rotateSlot: RotateTechStackSlot
}) {
  useTechStackRotationTimer(slot, techCount, reducedMotion, rotateSlot)
  return null
}

function subscribeToReducedMotion(onChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
  mediaQuery.addEventListener("change", onChange)
  return () => mediaQuery.removeEventListener("change", onChange)
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function TechStackGrid({
  techs,
  className,
}: {
  techs: ReadonlyArray<Tech>
  className?: string
}) {
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false
  )

  // Each slot has its own timer. When it fires, it picks a random *other*
  // slot and swaps the two technologies. This keeps every tech present
  // exactly once at any moment.
  const { order: animatedOrder, rotateSlot } = useTechStackRotation(
    techs.length
  )

  return (
    <LazyMotion features={domAnimation}>
      <div
        className={cn(
          "grid grid-cols-2 gap-px bg-border sm:grid-cols-4 xl:grid-cols-8",
          className
        )}
      >
        {techs.map((slot, slotIdx) => {
          const tech = techs[animatedOrder[slotIdx] ?? slotIdx] ?? slot
          return (
            <div
              key={slotIdx}
              className="group relative flex h-20 items-center justify-center gap-2 overflow-hidden bg-background px-4 py-6 text-copy-13 text-muted-foreground transition-colors hover:bg-accent/40"
            >
              <TechStackRotationTimer
                slot={slotIdx}
                techCount={techs.length}
                reducedMotion={reducedMotion}
                rotateSlot={rotateSlot}
              />
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={tech.name}
                  initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  {...(reducedMotion ? {} : { exit: { opacity: 0, y: -8 } })}
                  transition={{
                    duration: TRANSITION_MS,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-center justify-center gap-2"
                >
                  <Image
                    src={`/logos/${tech.logo}.svg`}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 shrink-0 dark:invert"
                    aria-hidden
                  />
                  <span className="font-medium">{tech.name}</span>
                </m.div>
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </LazyMotion>
  )
}
