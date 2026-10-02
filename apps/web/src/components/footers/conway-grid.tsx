"use client"

/**
 * Conway Game of Life signature band rendered in the apps/web footer.
 *
 * Decorative only, not content. `<ConwayBand />` is the entry point — it
 * owns the local `paused` state and renders both the visual grid
 * (`<ConwayGrid />`, aria-hidden) and the keyboard-accessible pause
 * control (`<ConwayPauseButton />`). The footer stays a Server Component
 * and only references `<ConwayBand />`.
 *
 * Wiring rules:
 *   - Navigation reseeds: `<ConwayGrid />` is keyed by `pathname` in
 *     `<ConwayBand />`. Every client-side navigation remounts the grid,
 *     resetting all state and seeding with a fresh `Math.random` draw.
 *     Query strings do NOT change `pathname` and therefore do NOT reseed.
 *   - `useReducedMotion()` freezes the grid when the user has the OS
 *     reduced-motion flag on. The seed runs so the band has a frozen
 *     initial frame.
 *   - `IntersectionObserver` pauses the tick when scrolled off-screen.
 *   - `document.visibilityState` pauses the tick when the tab is hidden.
 *   - The pause button flips a local `paused` flag — the timer early-
 *     returns without touching the simulation state. Resume is a true
 *     continuation, not a reseed.
 *   - The simulation reaches a fixed point when `stepGrid(current)`
 *     equals `current` cell-by-cell. We set `finished = true` and the
 *     timer effect re-runs with an early return; no further ticks.
 *     Oscillators (blinker, pulsar) are not equal to themselves, so they
 *     keep ticking. Resize and remount both reset `finished`.
 *
 * Performance: at 1200px wide, an estimated ~525 live `<rect>` on average
 * (varies). 1.5KB `Uint8Array`. The tick callback uses the `setGrid`
 * updater (pure function of the current state).
 *
 * Exports:
 *   - `<ConwayBand />`            — the only thing the footer imports.
 *   - `<ConwayGrid />`             — visual grid (aria-hidden).
 *   - `<ConwayPauseButton />`      — keyboard-accessible toggle.
 *   - `seedGrid` / `stepGrid` / `gridsEqual` / `centerIndex` / `countLive`
 *     — pure functions, unit-testable in isolation.
 */

import * as React from "react"
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { usePathname } from "next/navigation"
import { useReducedMotion } from "motion/react"
import { cn } from "@workspace/ui/lib/utils"

const CELL_SIZE = 8
const HEIGHT = 240
const ROWS = Math.floor(HEIGHT / CELL_SIZE)
const TICK_MS = 100

export function centerIndex(cols: number, rows: number): number {
  return Math.floor(rows / 2) * cols + Math.floor(cols / 2)
}

export function countLive(grid: Uint8Array): number {
  let n = 0
  for (let i = 0; i < grid.length; i++) if (grid[i] === 1) n++
  return n
}

/**
 * Seed a grid with radial density. Centre has up to 50% chance of being
 * alive per cell; edges have ~5%. If the random roll produces a fully-dead
 * grid, force a single live cell at `centerIndex` so the band never starts
 * visually empty. An isolated forced cell dies on tick 0, so the band
 * transitions cleanly to an empty final state.
 */
export function seedGrid(
  cols: number,
  rows: number,
  rng: () => number,
): Uint8Array {
  const grid = new Uint8Array(cols * rows)
  const centerCol = cols > 0 ? (cols - 1) / 2 : 0
  const maxDistance = Math.max(centerCol, 1)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const distance = Math.abs(c - centerCol) / maxDistance
      const probability = 0.05 + (1 - distance ** 2) * 0.45
      grid[r * cols + c] = rng() < probability ? 1 : 0
    }
  }

  if (countLive(grid) === 0 && grid.length > 0) {
    grid[centerIndex(cols, rows)] = 1
  }

  return grid
}

/**
 * Classic Conway B3/S23 with hard borders. A live cell with 2 or 3
 * live neighbours survives; a dead cell with exactly 3 live neighbours
 * becomes alive; everything else dies. Cells outside the grid count
 * as 0 neighbours (no wraparound).
 */
export function stepGrid(
  grid: Uint8Array,
  cols: number,
  rows: number,
): Uint8Array {
  const next = new Uint8Array(grid.length)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let n = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const rr = r + dr
          const cc = c + dc
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue
          n += grid[rr * cols + cc] ?? 0
        }
      }
      const idx = r * cols + c
      const alive = grid[idx] === 1
      next[idx] =
        alive && (n === 2 || n === 3) ? 1 : !alive && n === 3 ? 1 : 0
    }
  }
  return next
}

/**
 * Cell-by-cell equality. Stable grids (block, boat, loaf, beehive) all
 * return true from step 1. Oscillators (blinker, pulsar) return false
 * between consecutive phases. Dead grids return true (empty === empty).
 */
export function gridsEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

// ----------------------------------------------------------------------
// ConwayPauseButton — keyboard-accessible toggle. Stable label,
// aria-pressed reflects state. W3C APG-aligned.
// ----------------------------------------------------------------------

export function ConwayPauseButton({
  paused,
  onToggle,
}: {
  paused: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={paused}
      onClick={onToggle}
      className="text-muted-foreground hover:text-foreground text-label-13 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      Pause animation
    </button>
  )
}

// ----------------------------------------------------------------------
// ConwayGrid — visual, aria-hidden. The parent <ConwayBand /> owns the
// `paused` state and passes it down. <ConwayGrid /> is also keyed by
// `pathname` in the parent, so every client-side navigation triggers a
// full remount (fresh Math.random seed).
// ----------------------------------------------------------------------

export function ConwayGrid({
  paused,
  className,
}: {
  paused: boolean
  className?: string
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  const [cols, setCols] = useState(0)
  const [finished, setFinished] = useState(false)
  const [grid, setGrid] = useState<Uint8Array>(() => new Uint8Array(0))

  const [isInView, setIsInView] = useState(true)
  const [docVisible, setDocVisible] = useState<boolean>(
    typeof document === "undefined"
      ? true
      : document.visibilityState === "visible",
  )

  // Initial measurement + seed. useLayoutEffect runs synchronously after
  // the DOM is mounted but before the browser paints, which lets us
  // measure the wrapper width and seed the grid without a visible
  // empty-frame flash.
  useLayoutEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const w = el.getBoundingClientRect().width
    const measured = Math.floor(w / CELL_SIZE)
    setCols(measured)
    if (measured > 0) {
      setGrid(seedGrid(measured, ROWS, Math.random))
      setFinished(false)
    }
  }, [])

  // ResizeObserver: re-measure cols on every layout change. When the
  // measured column count differs from the current one, reseed. The
  // callback runs as an observer callback, not inside a useEffect body,
  // so the cascading-render lint rule does not apply.
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width
      const measured = Math.floor(w / CELL_SIZE)
      if (measured === cols) return
      setCols(measured)
      if (measured > 0) {
        setGrid(seedGrid(measured, ROWS, Math.random))
        setFinished(false)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [cols])

  // IntersectionObserver: pause when scrolled out of view.
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) setIsInView(entry.isIntersecting)
      },
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // document.visibilityState: pause when the tab is hidden.
  useEffect(() => {
    const onVis = () => setDocVisible(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [])

  // Tick effect. Re-runs whenever a gating dep flips. The setGrid
  // updater is a pure function of the current state. On stable-grid
  // detection, sets `finished = true` (no other bump), the effect re-runs
  // and the early-return keeps the timer off.
  useEffect(() => {
    if (cols === 0) return
    if (reduceMotion) return
    if (paused) return
    if (finished) return
    if (!isInView || !docVisible) return

    const interval = window.setInterval(() => {
      setGrid((current) => {
        const next = stepGrid(current, cols, ROWS)
        if (gridsEqual(current, next)) {
          setFinished(true)
        }
        return next
      })
    }, TICK_MS)

    return () => window.clearInterval(interval)
  }, [cols, paused, finished, isInView, docVisible, reduceMotion])

  const liveRects = useMemo(() => {
    if (cols === 0 || grid.length !== cols * ROWS) return []
    const centerCol = (cols - 1) / 2
    const maxDistance = Math.max(centerCol, 1)
    const rects: Array<{
      idx: number
      x: number
      y: number
      opacity: number
    }> = []
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c
        if (grid[idx] !== 1) continue
        const distance = Math.abs(c - centerCol) / maxDistance
        const opacity = 0.05 + (1 - distance * distance) * 0.95
        rects.push({
          idx,
          x: c * CELL_SIZE,
          y: r * CELL_SIZE,
          opacity,
        })
      }
    }
    return rects
  }, [grid, cols])

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      role="presentation"
      className={cn("relative h-60 overflow-hidden bg-muted/20", className)}
    >
      {cols > 0 && grid.length === cols * ROWS && (
        <svg
          width={cols * CELL_SIZE}
          height={ROWS * CELL_SIZE}
          viewBox={`0 0 ${cols * CELL_SIZE} ${ROWS * CELL_SIZE}`}
          className="block text-foreground"
        >
          {liveRects.map((cell) => (
            <rect
              key={cell.idx}
              x={cell.x}
              y={cell.y}
              width={CELL_SIZE}
              height={CELL_SIZE}
              fill="currentColor"
              fillOpacity={cell.opacity}
            />
          ))}
        </svg>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// ConwayBand — the only component the footer imports. Owns `paused`,
// renders the visual grid (aria-hidden) plus the keyboard-accessible
// pause button. Keys <ConwayGrid /> by pathname so every client-side
// navigation reseeds the simulation.
// ----------------------------------------------------------------------

export function ConwayBand({ className }: { className?: string }) {
  const pathname = usePathname()
  const [paused, setPaused] = useState(false)
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ConwayGrid key={pathname} paused={paused} />
      <div className="flex items-center justify-end px-6">
        <ConwayPauseButton
          paused={paused}
          onToggle={() => setPaused((v) => !v)}
        />
      </div>
    </div>
  )
}