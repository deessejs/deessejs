"use client"

/**
 * Conway Game of Life signature band rendered in the apps/web footer.
 *
 * Decorative only, not content. `<ConwayBand />` is the entry point
 * imported by the footer. It renders the visual grid (`<ConwayGrid />`,
 * aria-hidden).
 *
 * Wiring rules:
 *   - Navigation reseeds: `<ConwayGrid />` is keyed by `pathname` in
 *     `<ConwayBand />`. Every client-side navigation remounts the grid,
 *     resetting all state and seeding with a fresh `Math.random` draw.
 *     Query strings do NOT change `pathname` and therefore do NOT reseed.
 *   - `useReducedMotion()` freezes the grid when the user has the OS
 *     reduced-motion flag on. The simulation and the injection timer are
 *     both suspended. The seed runs so the band has a frozen initial frame.
 *   - `IntersectionObserver` suspends when scrolled off-screen.
 *   - `document.visibilityState` suspends when the tab is hidden.
 *   - The simulation reaches a fixed point when `stepGrid(current)`
 *     equals `current` cell-by-cell. The reducer switches `mode` to
 *     `"stable"`; the next Conway step is a no-op until the next
 *     injection reactivates it.
 *   - Pattern injection: every 8-15 seconds (first injection 8-12s after
 *     seed), the timer attempts to drop a glider, LWSS, or R-pentomino
 *     into an empty rectangle (with a 2-cell margin) anywhere in the
 *     grid. The placement is rejected if no such rectangle exists after
 *     5 attempts; in that case the next attempt is rescheduled in 1s.
 *     Injection is orthogonal to `mode`: oscillators and still lives both
 *     receive injections on the same schedule.
 *   - Suspension preserves the remaining delay. The countdown only
 *     decrements when the component is not suspended.
 *
 * Performance: at 1200px wide, an estimated ~525 live `<rect>` on
 * average (varies). 1.5KB `Uint8Array`. The timer calls `dispatch` with
 * a pure reducer; no setState updaters carry side effects.
 *
 * Exports:
 *   - `<ConwayBand />`            — the only thing the footer imports.
 *   - `<ConwayGrid />`             — visual grid (aria-hidden).
 *   - `seedGrid` / `stepGrid` / `gridsEqual` / `centerIndex` / `countLive`
 *     — pure functions, unit-testable in isolation.
 *   - `patternCells` / `canPlaceEmpty` / `injectPattern` / `pickInjection`
 *     — pure functions used by the injection path, also unit-testable.
 */

import * as React from "react"
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
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
const INJECTION_MARGIN = 2
const INJECTION_ATTEMPTS = 5
const INJECTION_RETRY_DELAY = 1_000
const INJECTION_RETRY_TICKS = Math.round(INJECTION_RETRY_DELAY / TICK_MS)
const FIRST_INJECTION_TICKS_MIN = 80 // 8s at 100ms/tick
const FIRST_INJECTION_TICKS_MAX = 120 // 12s
const NEXT_INJECTION_TICKS_MIN = 80 // 8s
const NEXT_INJECTION_TICKS_MAX = 150 // 15s

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
// Pattern injection — used to relive stable or looping grids
// ----------------------------------------------------------------------

export type ConwayPattern = "glider" | "lwss-h" | "r-pentomino"

/**
 * Relative cell coordinates for each pattern, anchored at (0, 0).
 * Bounding box is derived from max(col) + 1 by max(row) + 1.
 */
const PATTERNS: Readonly<Record<ConwayPattern, ReadonlyArray<readonly [number, number]>>> = {
  glider: [
    [1, 0],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ],
  "lwss-h": [
    [1, 0],
    [4, 0],
    [0, 1],
    [0, 2],
    [4, 2],
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
  ],
  "r-pentomino": [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ],
}

export function patternCells(
  pattern: ConwayPattern,
): ReadonlyArray<readonly [number, number]> {
  return PATTERNS[pattern]
}

export function patternWidth(pattern: ConwayPattern): number {
  let max = -1
  for (const [c] of PATTERNS[pattern]) if (c > max) max = c
  return max + 1
}

export function patternHeight(pattern: ConwayPattern): number {
  let max = -1
  for (const [, r] of PATTERNS[pattern]) if (r > max) max = r
  return max + 1
}

/**
 * True if the rectangle [x-margin, x+W+margin) × [y-margin, y+H+margin)
 * is fully inside the grid AND fully empty (every cell is 0). The margin
 * is a buffer so the pattern's B3/S23 neighbourhood is unconstrained.
 */
export function canPlaceEmpty(
  grid: Uint8Array,
  cols: number,
  rows: number,
  x: number,
  y: number,
  pattern: ConwayPattern,
  margin: number,
): boolean {
  const w = patternWidth(pattern)
  const h = patternHeight(pattern)
  const x0 = x - margin
  const y0 = y - margin
  const x1 = x + w + margin
  const y1 = y + h + margin
  if (x0 < 0 || y0 < 0 || x1 > cols || y1 > rows) return false
  for (let r = y0; r < y1; r++) {
    for (let c = x0; c < x1; c++) {
      if (grid[r * cols + c] === 1) return false
    }
  }
  return true
}

/**
 * Add the pattern's cells to the grid. Returns a new Uint8Array; the
 * original is not mutated. Cells already alive stay alive (additive
 * OR, not XOR). The caller is responsible for verifying the placement
 * is valid via `canPlaceEmpty` first.
 */
export function injectPattern(
  grid: Uint8Array,
  cols: number,
  rows: number,
  x: number,
  y: number,
  pattern: ConwayPattern,
): Uint8Array {
  const next = new Uint8Array(grid)
  for (const [dc, dr] of PATTERNS[pattern]) {
    const c = x + dc
    const r = y + dr
    if (r < 0 || r >= rows || c < 0 || c >= cols) continue
    next[r * cols + c] = 1
  }
  return next
}

const PATTERN_KEYS: ReadonlyArray<ConwayPattern> = [
  "glider",
  "lwss-h",
  "r-pentomino",
]

/**
 * Pick a random pattern + position where the pattern can be placed in
 * an empty rectangle (with margin). Returns null if no such placement
 * exists after `maxAttempts` tries. Pure (no Math.random side effect
 * beyond reading from `rng`).
 */
export function pickInjection(
  grid: Uint8Array,
  cols: number,
  rows: number,
  rng: () => number,
  maxAttempts: number = INJECTION_ATTEMPTS,
): { pattern: ConwayPattern; x: number; y: number } | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pattern = PATTERN_KEYS[Math.floor(rng() * PATTERN_KEYS.length)]
    if (!pattern) continue
    const w = patternWidth(pattern)
    const h = patternHeight(pattern)
    // Origin bounds: x ∈ [margin, cols - w - margin] inclusive.
    // Position count = cols - w - 2*margin + 1.
    const xRange = cols - w - 2 * INJECTION_MARGIN + 1
    const yRange = rows - h - 2 * INJECTION_MARGIN + 1
    if (xRange <= 0 || yRange <= 0) continue
    const x = Math.floor(rng() * xRange) + INJECTION_MARGIN
    const y = Math.floor(rng() * yRange) + INJECTION_MARGIN
    if (canPlaceEmpty(grid, cols, rows, x, y, pattern, INJECTION_MARGIN)) {
      return { pattern, x, y }
    }
  }
  return null
}

// ----------------------------------------------------------------------
// Sim reducer — pure, atomic state transitions for the grid + mode
// ----------------------------------------------------------------------

type SimState = {
  cols: number
  rows: number
  grid: Uint8Array
  mode: "active" | "stable"
}

type SimAction =
  | { type: "STEP" }
  | { type: "INJECT"; pattern: ConwayPattern; x: number; y: number }
  | { type: "SEED"; grid: Uint8Array; cols: number; rows: number }

function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case "SEED":
      return {
        cols: action.cols,
        rows: action.rows,
        grid: action.grid,
        mode: "active",
      }
    case "STEP": {
      if (state.mode !== "active") return state
      const next = stepGrid(state.grid, state.cols, state.rows)
      if (gridsEqual(state.grid, next)) {
        return { ...state, grid: next, mode: "stable" }
      }
      return { ...state, grid: next }
    }
    case "INJECT": {
      const next = injectPattern(
        state.grid,
        state.cols,
        state.rows,
        action.x,
        action.y,
        action.pattern,
      )
      if (gridsEqual(state.grid, next)) {
        // No cells were added (or the pattern was a subset of an existing
        // still life). Do not flip mode — avoids reactivating Conway for
        // nothing.
        return state
      }
      return { ...state, grid: next, mode: "active" }
    }
  }
}

const INITIAL_SIM: SimState = {
  cols: 0,
  rows: 0,
  grid: new Uint8Array(0),
  mode: "active",
}

// ----------------------------------------------------------------------
// ConwayGrid — visual, aria-hidden. Keyed by `pathname` in the parent
// <ConwayBand />, so every client-side navigation triggers a full
// remount (fresh Math.random seed).
// ----------------------------------------------------------------------

function randomInRange(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

export function ConwayGrid({ className }: { className?: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  const [sim, dispatch] = useReducer(simReducer, INITIAL_SIM)
  const cols = sim.cols
  const rows = sim.rows
  const grid = sim.grid

  const [isInView, setIsInView] = useState(true)
  const [docVisible, setDocVisible] = useState<boolean>(
    typeof document === "undefined"
      ? true
      : document.visibilityState === "visible",
  )

  // Injection countdown in ticks. Decremented on every non-suspended
  // tick. Independent of `sim.mode` so a stable grid still receives
  // injections on the same schedule.
  const [ticksUntilInjection, setTicksUntilInjection] = useState<number>(
    () => randomInRange(FIRST_INJECTION_TICKS_MIN, FIRST_INJECTION_TICKS_MAX, Math.random),
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
    if (measured > 0) {
      dispatch({
        type: "SEED",
        grid: seedGrid(measured, ROWS, Math.random),
        cols: measured,
        rows: ROWS,
      })
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
      if (measured > 0) {
        dispatch({
          type: "SEED",
          grid: seedGrid(measured, ROWS, Math.random),
          cols: measured,
          rows: ROWS,
        })
        setTicksUntilInjection(
          randomInRange(FIRST_INJECTION_TICKS_MIN, FIRST_INJECTION_TICKS_MAX, Math.random),
        )
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [cols])

  // IntersectionObserver: suspend when scrolled out of view.
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

  // document.visibilityState: suspend when the tab is hidden.
  useEffect(() => {
    const onVis = () => setDocVisible(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [])

  // Tick effect. The setInterval is set up once per dep change and is
  // NOT re-created on every `ticksUntilInjection` mutation (that would
  // introduce drift). The countdown is decremented inside the timer
  // callback on every non-suspended tick, regardless of `sim.mode`.
  useEffect(() => {
    if (cols === 0) return
    if (!isInView || !docVisible || reduceMotion) return

    const interval = window.setInterval(() => {
      // (1) Decrement the countdown. Do this first so the injection check
      // below sees the updated value.
      setTicksUntilInjection((t) => {
        if (t <= 0) return 0
        return t - 1
      })

      // (2) Try an injection if the countdown has reached zero.
      if (ticksUntilInjection <= 0) {
        const pick = pickInjection(grid, cols, rows, Math.random)
        if (pick) {
          dispatch({ type: "INJECT", pattern: pick.pattern, x: pick.x, y: pick.y })
          setTicksUntilInjection(
            randomInRange(NEXT_INJECTION_TICKS_MIN, NEXT_INJECTION_TICKS_MAX, Math.random),
          )
        } else {
          // No placement found this tick — retry in INJECTION_RETRY_TICKS
          // ticks instead of hammering the picker.
          setTicksUntilInjection(INJECTION_RETRY_TICKS)
        }
        return
      }

      // (3) Otherwise, advance Conway if the grid is still active. A
      // stable grid stays put; the next injection will reactivate it.
      if (sim.mode === "active") {
        dispatch({ type: "STEP" })
      }
    }, TICK_MS)

    return () => window.clearInterval(interval)
    // rows is a module-level constant (ROWS), never changes — no need
    // to include it in deps. The exhaustive-deps lint sees `cols` from
    // sim but not the matching `rows` extraction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, sim.mode, grid, ticksUntilInjection, isInView, docVisible, reduceMotion])

  const liveRects = useMemo(() => {
    if (cols === 0 || grid.length !== cols * rows) return []
    const centerCol = (cols - 1) / 2
    const maxDistance = Math.max(centerCol, 1)
    const rects: Array<{
      idx: number
      x: number
      y: number
      opacity: number
    }> = []
    for (let r = 0; r < rows; r++) {
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
  }, [grid, cols, rows])

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      role="presentation"
      className={cn("relative h-60 overflow-hidden", className)}
    >
      {cols > 0 && grid.length === cols * rows && (
        <svg
          width={cols * CELL_SIZE}
          height={rows * CELL_SIZE}
          viewBox={`0 0 ${cols * CELL_SIZE} ${rows * CELL_SIZE}`}
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
// ConwayBand — the only component the footer imports. Renders the
// visual grid (aria-hidden). Keys <ConwayGrid /> by pathname so every
// client-side navigation reseeds the simulation.
// ----------------------------------------------------------------------

export function ConwayBand({ className }: { className?: string }) {
  const pathname = usePathname()
  return (
    <div className={cn("flex flex-col", className)}>
      <ConwayGrid key={pathname} />
    </div>
  )
}