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
 * Performance: at 1200px wide, the grid is `~150 cols × 30 rows`
 * (~4 500 cells, ~4.4 KiB `Uint8Array`). The live-cell count varies by
 * seed but is roughly bounded by the cell count. The timer calls
 * `dispatch` with a pure reducer; the countdown and grid are mirrored
 * to refs so the interval is set up once per (cols, visibility)
 * change — not on every tick.
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
 * Convert a pointer position to grid coordinates. Returns null when the
 * pointer is outside the SVG rectangle, the rectangle is degenerate,
 * or the grid dimensions are invalid. Strictly validates that the
 * returned row and column are integers in bounds — `Math.floor` on a
 * floating point can occasionally land on a boundary value, and the
 * extra checks make the contract explicit.
 */
export function pointerToCell(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  cols: number,
  rows: number,
): { col: number; row: number } | null {
  if (cols <= 0 || rows <= 0) return null
  if (rect.width <= 0 || rect.height <= 0) return null
  const x = clientX - rect.left
  const y = clientY - rect.top
  if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null
  const col = Math.floor((x / rect.width) * cols)
  const row = Math.floor((y / rect.height) * rows)
  if (!Number.isInteger(col) || !Number.isInteger(row)) return null
  if (col < 0 || col >= cols || row < 0 || row >= rows) return null
  return { col, row }
}

/**
 * Bresenham line algorithm between two grid cells. Returns the list of
 * cells along the inclusive segment `[x0, y0] .. [x1, y1]`. Iteration
 * count is bounded by `dx + dy + 2` so a malformed input cannot
 * infinite-loop.
 */
export function drawLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Array<[number, number]> {
  if (x0 === x1 && y0 === y1) return [[x0, y0]]
  const cells: Array<[number, number]> = [[x0, y0]]
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  let x = x0
  let y = y0
  const maxIter = dx + dy + 2
  let i = 0
  while (i++ < maxIter) {
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
    cells.push([x, y])
  }
  return cells
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
 * Classic Conway B3/S23 on a toroidal grid. A live cell with 2 or 3
 * live neighbours survives; a dead cell with exactly 3 live neighbours
 * becomes alive; everything else dies. The grid wraps on both axes: the
 * left edge is adjacent to the right edge, and the top edge to the
 * bottom edge. `cols` and `rows` must both be >= 3 for the standard
 * 8-neighbour kernel to have distinct coordinates after wrapping; below
 * that, the caller should not invoke the simulation.
 */
export function stepGrid(
  grid: Uint8Array,
  cols: number,
  rows: number,
): Uint8Array {
  return stepWithTopology(grid, createTopology(cols, rows)).grid
}

/**
 * Precomputed toroidal topology. The dimensions only change there; the
 * neighbour offsets can be prepared once and reused on every step.
 *
 * `left[c]` and `right[c]` are column indices. `above[r]` and `below[r]`
 * are direct offsets in the row-major grid, so the inner loop avoids a
 * multiplication per neighbour.
 */
export type ConwayTopology = {
  cols: number
  rows: number
  left: Int32Array
  right: Int32Array
  above: Int32Array
  below: Int32Array
}

export function createTopology(cols: number, rows: number): ConwayTopology {
  const left = new Int32Array(cols)
  const right = new Int32Array(cols)
  const above = new Int32Array(rows)
  const below = new Int32Array(rows)

  for (let c = 0; c < cols; c++) {
    left[c] = c === 0 ? cols - 1 : c - 1
    right[c] = c === cols - 1 ? 0 : c + 1
  }

  for (let r = 0; r < rows; r++) {
    above[r] = (r === 0 ? rows - 1 : r - 1) * cols
    below[r] = (r === rows - 1 ? 0 : r + 1) * cols
  }

  return { cols, rows, left, right, above, below }
}

/**
 * Apply one B3/S23 generation using a precomputed topology. Returns
 * the new grid plus a `changed` flag (true if at least one cell
 * flipped). The caller decides what to do with stability; the pure
 * function does not mutate any input.
 *
 * `cols` and `rows` must both be >= 3 for the standard 8-neighbour
 * kernel to have distinct coordinates after wrapping.
 */
export function stepWithTopology(
  grid: Uint8Array,
  topology: ConwayTopology,
): { grid: Uint8Array; changed: boolean } {
  const { cols, rows, left, right, above, below } = topology
  const next = new Uint8Array(grid.length)
  let changed = false

  for (let r = 0; r < rows; r++) {
    const row = r * cols
    const up = above[r] ?? 0
    const down = below[r] ?? 0

    for (let c = 0; c < cols; c++) {
      const l = left[c] ?? 0
      const rr = right[c] ?? 0
      const idx = row + c

      const neighbours =
        (grid[up + l] ?? 0) +
        (grid[up + c] ?? 0) +
        (grid[up + rr] ?? 0) +
        (grid[row + l] ?? 0) +
        (grid[row + rr] ?? 0) +
        (grid[down + l] ?? 0) +
        (grid[down + c] ?? 0) +
        (grid[down + rr] ?? 0)

      const alive = grid[idx] ?? 0
      const value =
        neighbours === 3 || (alive === 1 && neighbours === 2) ? 1 : 0

      next[idx] = value
      if (value !== alive) changed = true
    }
  }

  return { grid: next, changed }
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
 * Pre-computed metadata for each pattern. `cells` are the relative
 * coordinates; `width` and `height` are the bounding box dimensions.
 * Computing them once at module load avoids re-scanning the cell
 * lists in `pickInjection` and the reducer.
 */
const PATTERN_META: Readonly<
  Record<
    ConwayPattern,
    {
      cells: ReadonlyArray<readonly [number, number]>
      width: number
      height: number
    }
  >
> = (() => {
  const build = (
    cells: ReadonlyArray<readonly [number, number]>,
  ): { cells: ReadonlyArray<readonly [number, number]>; width: number; height: number } => {
    let width = 0
    let height = 0
    for (const [c, r] of cells) {
      if (c + 1 > width) width = c + 1
      if (r + 1 > height) height = r + 1
    }
    return { cells, width, height }
  }
  return {
    glider: build([
      [1, 0],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ]),
    "lwss-h": build([
      [1, 0],
      [4, 0],
      [0, 1],
      [0, 2],
      [4, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
    ]),
    "r-pentomino": build([
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ]),
  }
})()

export function patternCells(
  pattern: ConwayPattern,
): ReadonlyArray<readonly [number, number]> {
  return PATTERN_META[pattern].cells
}

export function patternWidth(pattern: ConwayPattern): number {
  return PATTERN_META[pattern].width
}

export function patternHeight(pattern: ConwayPattern): number {
  return PATTERN_META[pattern].height
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
  const meta = PATTERN_META[pattern]
  const x0 = x - margin
  const y0 = y - margin
  const x1 = x + meta.width + margin
  const y1 = y + meta.height + margin
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
  for (const [dc, dr] of PATTERN_META[pattern].cells) {
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
    const meta = PATTERN_META[pattern]
    // Origin bounds: x ∈ [margin, cols - w - margin] inclusive.
    // Position count = cols - w - 2*margin + 1.
    const xRange = cols - meta.width - 2 * INJECTION_MARGIN + 1
    const yRange = rows - meta.height - 2 * INJECTION_MARGIN + 1
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
  topology: ConwayTopology
}

type SimAction =
  | { type: "STEP" }
  | { type: "INJECT"; pattern: ConwayPattern; x: number; y: number }
  | { type: "SEED"; grid: Uint8Array; cols: number; rows: number }
  | { type: "DRAW"; cells: ReadonlyArray<readonly [number, number]> }

function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case "SEED":
      return {
        cols: action.cols,
        rows: action.rows,
        grid: action.grid,
        mode: "active",
        topology: createTopology(action.cols, action.rows),
      }
    case "STEP": {
      if (state.mode !== "active") return state
      if (state.cols < 3 || state.rows < 3) return state
      const result = stepWithTopology(state.grid, state.topology)
      if (!result.changed) {
        // Grid reached a fixed point — flip to stable without
        // allocating a new Uint8Array (the reference is unchanged).
        return { ...state, mode: "stable" }
      }
      return { ...state, grid: result.grid }
    }
    case "INJECT": {
      // Belt-and-braces: even though `pickInjection` only returns
      // placements with empty margins, the grid might have changed
      // between the picker call and the dispatch (a render-delay race).
      // Reject if the rectangle around (x, y) is no longer empty.
      if (
        !canPlaceEmpty(
          state.grid,
          state.cols,
          state.rows,
          action.x,
          action.y,
          action.pattern,
          INJECTION_MARGIN,
        )
      ) {
        return state
      }
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
    case "DRAW": {
      // Allocate the next Uint8Array lazily — only when at least one
      // cell actually changes (0 -> 1). Cells already alive are
      // skipped, so repainting the same cell is idempotent. The mode
      // flips to "active" because the user just drew something: a
      // stable grid should wake up and run again.
      let next: Uint8Array | null = null
      for (const cell of action.cells) {
        const col = cell[0]
        const row = cell[1]
        if (!Number.isInteger(col) || !Number.isInteger(row)) continue
        if (
          col < 0 ||
          col >= state.cols ||
          row < 0 ||
          row >= state.rows
        )
          continue
        const idx = row * state.cols + col
        if (state.grid[idx] === 1) continue
        if (next === null) next = new Uint8Array(state.grid)
        next[idx] = 1
      }
      if (next === null) return state
      return { ...state, grid: next, mode: "active" }
    }
  }
}

const INITIAL_SIM: SimState = {
  cols: 0,
  rows: 0,
  grid: new Uint8Array(0),
  mode: "active",
  topology: createTopology(0, 0),
}

// ----------------------------------------------------------------------
// ConwayGrid — visual, aria-hidden. Keyed by `pathname` in the parent
// <ConwayBand />, so every client-side navigation triggers a full
// remount (fresh Math.random seed).
// ----------------------------------------------------------------------

function randomInRange(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

// ----------------------------------------------------------------------
// LiveCells — a memoised SVG layer that draws one <path> per column.
// Each path groups all live cells in that column under a single
// `fillOpacity` (the per-column radial gradient), so the DOM count is
// bounded by the number of columns rather than by the number of live
// cells. React.memo + stable props keep the cursor's keyboard state
// from re-rendering this layer.
// ----------------------------------------------------------------------

type LiveCellsProps = {
  grid: Uint8Array
  cols: number
  rows: number
  columnOpacity: Float64Array
}

const LiveCells = React.memo(function LiveCells({
  grid,
  cols,
  rows,
  columnOpacity,
}: LiveCellsProps) {
  const paths = useMemo(() => {
    if (cols === 0 || rows === 0 || grid.length !== cols * rows) return [] as Array<{ col: number; d: string }>
    const out: Array<{ col: number; d: string }> = []
    for (let c = 0; c < cols; c++) {
      const x = c * CELL_SIZE
      const commands: string[] = []
      for (let r = 0; r < rows; r++) {
        if (grid[r * cols + c] !== 1) continue
        const y = r * CELL_SIZE
        commands.push(`M${x},${y}h${CELL_SIZE}v${CELL_SIZE}h-${CELL_SIZE}Z`)
      }
      if (commands.length > 0) {
        out.push({ col: c, d: commands.join("") })
      }
    }
    return out
  }, [grid, cols, rows])

  return (
    <g fill="currentColor" pointerEvents="none">
      {paths.map(({ col, d }) => (
        <path key={col} d={d} fillOpacity={columnOpacity[col] ?? 0} />
      ))}
    </g>
  )
})

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

  // Refs that mirror the reducer's state and the injection countdown so
  // the timer effect does not have to re-install on every generation or
  // every countdown decrement. The interval is set up once per
  // dependency change of `cols`, `isInView`, `docVisible`, and
  // `reduceMotion` — none of which flips on each tick.
  const gridRef = useRef<Uint8Array>(sim.grid)
  const modeRef = useRef<SimState["mode"]>(sim.mode)
  const countdownRef = useRef<number>(0)

  // Per-column opacity pre-computed when the column count changes. The
  // radial gradient is a function of column index only; computing it
  // once per (cols) change avoids recomputing the same alpha for every
  // live cell on every generation.
  const columnOpacity = useMemo<Float64Array>(() => {
    const out = new Float64Array(cols)
    if (cols === 0) return out
    const centerCol = (cols - 1) / 2
    const maxDistance = Math.max(centerCol, 1)
    for (let c = 0; c < cols; c++) {
      const distance = Math.abs(c - centerCol) / maxDistance
      out[c] = 0.05 + (1 - distance * distance) * 0.95
    }
    return out
  }, [cols])

  // Keep `gridRef` and `modeRef` in sync with the reducer output.
  // This is a one-way mirror; we never read the ref to drive a render.
  useEffect(() => {
    gridRef.current = sim.grid
    modeRef.current = sim.mode
  }, [sim.grid, sim.mode])

  // Drawing state. The pointer keeps capturing on the SVG until it is
  // released or the gesture ends. `lastCellRef` is cleared whenever the
  // pointer leaves the grid so a re-entry doesn't draw a long line back
  // to the last interior point.
  const svgRef = useRef<SVGSVGElement>(null)
  const isDrawingRef = useRef(false)
  const lastCellRef = useRef<[number, number] | null>(null)
  const pointerIdRef = useRef<number | null>(null)

  // Keyboard cursor state. Initialised to null; set on focus or on the
  // first arrow-key press.
  const [cursor, setCursor] = useState<[number, number] | null>(null)

  /**
   * End the active gesture cleanly. Releases the pointer capture if
   * it's still held, then resets the gesture state. Called on
   * pointerup / pointercancel / lostpointercapture, and on resize
   * before the grid is replaced.
   */
  const endGesture = () => {
    const id = pointerIdRef.current
    if (id !== null) {
      const svg = svgRef.current
      if (svg && svg.hasPointerCapture(id)) {
        try {
          svg.releasePointerCapture(id)
        } catch {
          // The pointer may already be released. Swallow.
        }
      }
    }
    pointerIdRef.current = null
    isDrawingRef.current = false
    lastCellRef.current = null
  }

  // Initial measurement + seed. useLayoutEffect runs synchronously after
  // the DOM is mounted but before the browser paints, which lets us
  // measure the wrapper width and seed the grid without a visible
  // empty-frame flash.
  useLayoutEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const w = el.getBoundingClientRect().width
    const measured = Math.floor(w / CELL_SIZE)
    if (measured >= 3) {
      dispatch({
        type: "SEED",
        grid: seedGrid(measured, ROWS, Math.random),
        cols: measured,
        rows: ROWS,
      })
      countdownRef.current = randomInRange(
        FIRST_INJECTION_TICKS_MIN,
        FIRST_INJECTION_TICKS_MAX,
        Math.random,
      )
    }
  }, [])

  // ResizeObserver: re-measure cols on every layout change. When the
  // measured column count differs from the current one, terminate any
  // active gesture (the wrapper dimensions are about to change and the
  // cached lastCellRef would otherwise trace a parasite line on the
  // next gesture), then reseed. The callback runs as an observer
  // callback, not inside a useEffect body, so the cascading-render
  // lint rule does not apply.
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width
      const measured = Math.floor(w / CELL_SIZE)
      if (measured === cols) return
      endGesture()
      if (measured >= 3) {
        dispatch({
          type: "SEED",
          grid: seedGrid(measured, ROWS, Math.random),
          cols: measured,
          rows: ROWS,
        })
        countdownRef.current = randomInRange(
          FIRST_INJECTION_TICKS_MIN,
          FIRST_INJECTION_TICKS_MAX,
          Math.random,
        )
        // Keep the cursor inside the new grid bounds.
        setCursor((cur) => {
          if (!cur) return cur
          return [
            Math.min(cur[0], measured - 1),
            Math.min(cur[1], ROWS - 1),
          ]
        })
      } else {
        // Below the safe dimension — suspend by zeroing out cols. The
        // tick effect's `cols < 3` gate stops Conway and injections.
        dispatch({ type: "SEED", grid: new Uint8Array(0), cols: 0, rows: ROWS })
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

  // Tick effect. The interval is set up once per visibility / dimension
  // change and is NOT re-installed on every grid mutation or countdown
  // decrement. The countdown is decremented inside the timer callback
  // on every non-suspended tick, regardless of `sim.mode`. The previous
  // state of the grid and the current countdown are read from refs so
  // the callback always sees the latest values without depending on
  // them.
  useEffect(() => {
    if (cols < 3) return
    if (!isInView || !docVisible || reduceMotion) return

    const interval = window.setInterval(() => {
      const current = gridRef.current

      // (1) Conway step first. Runs on every tick when the grid is
      // active, even when an injection also lands on this tick. The
      // injection is re-validated by the reducer against the latest
      // state after STEP, so a too-crowded pick may still be rejected.
      if (modeRef.current === "active") {
        dispatch({ type: "STEP" })
      }

      // (2) Decrement the countdown. The injection check fires when the
      // countdown reaches zero.
      const remaining = countdownRef.current > 0 ? countdownRef.current - 1 : 0
      countdownRef.current = remaining

      if (remaining > 0) return

      // (3) Injection attempt. Note: we deliberately do NOT re-run
      // Conway here to "find a placement" — that would double the
      // work. The reducer's INJECT branch re-checks canPlaceEmpty
      // against the post-STEP grid.
      const pick = pickInjection(current, cols, rows, Math.random)
      if (!pick) {
        // No placement found — retry in INJECTION_RETRY_TICKS ticks
        // instead of hammering the picker.
        countdownRef.current = INJECTION_RETRY_TICKS
        return
      }

      dispatch({
        type: "INJECT",
        pattern: pick.pattern,
        x: pick.x,
        y: pick.y,
      })
      countdownRef.current = randomInRange(
        NEXT_INJECTION_TICKS_MIN,
        NEXT_INJECTION_TICKS_MAX,
        Math.random,
      )
    }, TICK_MS)

    return () => window.clearInterval(interval)
  }, [cols, rows, isInView, docVisible, reduceMotion])

  // When the wrapper takes focus, initialise the keyboard cursor at
  // the centre of the grid (if the grid is wide enough).
  const handleFocus = () => {
    if (cols >= 3 && rows >= 1 && cursor === null) {
      setCursor([Math.floor(cols / 2), Math.floor(rows / 2)])
    }
  }

  return (
    <div
      ref={wrapperRef}
      role="application"
      aria-label="Conway grid. Click or drag to add live cells. Use arrow keys to move the cursor and Space to add a cell at the cursor."
      tabIndex={0}
      onFocus={handleFocus}
      onKeyDown={(e) =>
        handleKeyDown(e, cols, rows, cursor, setCursor, dispatch)
      }
      className={cn(
        "relative h-60 overflow-hidden touch-none focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      {cols > 0 && grid.length === cols * rows && (
        <svg
          ref={svgRef}
          width={cols * CELL_SIZE}
          height={rows * CELL_SIZE}
          viewBox={`0 0 ${cols * CELL_SIZE} ${rows * CELL_SIZE}`}
          aria-hidden="true"
          className="block cursor-crosshair text-foreground"
          onPointerDown={(e) =>
            handlePointerDown(
              e,
              cols,
              rows,
              isDrawingRef,
              lastCellRef,
              pointerIdRef,
              svgRef,
              dispatch,
            )
          }
          onPointerMove={(e) =>
            handlePointerMove(
              e,
              cols,
              rows,
              isDrawingRef,
              lastCellRef,
              pointerIdRef,
              dispatch,
            )
          }
          onPointerUp={(e) =>
            handlePointerEnd(e, isDrawingRef, lastCellRef, pointerIdRef, svgRef)
          }
          onPointerCancel={(e) =>
            handlePointerEnd(e, isDrawingRef, lastCellRef, pointerIdRef, svgRef)
          }
          onLostPointerCapture={(e) =>
            handlePointerEnd(e, isDrawingRef, lastCellRef, pointerIdRef, svgRef)
          }
        >
          <LiveCells
            grid={grid}
            cols={cols}
            rows={rows}
            columnOpacity={columnOpacity}
          />
          {cursor && (
            <rect
              x={cursor[0] * CELL_SIZE}
              y={cursor[1] * CELL_SIZE}
              width={CELL_SIZE}
              height={CELL_SIZE}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              pointerEvents="none"
              data-testid="conway-cursor"
            />
          )}
        </svg>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// Pointer handlers — the user can click or drag to add live cells.
// The simulation keeps running underneath; `DRAW` is just another
// reducer action. Only one pointer is tracked at a time: a second
// pointerdown while a gesture is active is rejected.
// ----------------------------------------------------------------------

const handlePointerDown = (
  e: React.PointerEvent<SVGSVGElement>,
  cols: number,
  rows: number,
  isDrawingRef: React.MutableRefObject<boolean>,
  lastCellRef: React.MutableRefObject<[number, number] | null>,
  pointerIdRef: React.MutableRefObject<number | null>,
  svgRef: React.RefObject<SVGSVGElement | null>,
  dispatch: React.Dispatch<SimAction>,
) => {
  if (pointerIdRef.current !== null) return
  // Reject non-primary buttons on mouse pointers. PointerType "mouse"
  // exposes e.button; touch / pen always have button === 0.
  if (e.pointerType === "mouse" && e.button !== 0) return
  const rect = e.currentTarget.getBoundingClientRect()
  const cell = pointerToCell(e.clientX, e.clientY, rect, cols, rows)
  if (!cell) return
  e.preventDefault()
  try {
    e.currentTarget.setPointerCapture(e.pointerId)
  } catch {
    // Some browsers throw if the pointer has already been released.
  }
  pointerIdRef.current = e.pointerId
  isDrawingRef.current = true
  const tuple: [number, number] = [cell.col, cell.row]
  lastCellRef.current = tuple
  dispatch({ type: "DRAW", cells: [tuple] })
}

const handlePointerMove = (
  e: React.PointerEvent<SVGSVGElement>,
  cols: number,
  rows: number,
  isDrawingRef: React.MutableRefObject<boolean>,
  lastCellRef: React.MutableRefObject<[number, number] | null>,
  pointerIdRef: React.MutableRefObject<number | null>,
  dispatch: React.Dispatch<SimAction>,
) => {
  if (!isDrawingRef.current) return
  if (pointerIdRef.current !== e.pointerId) return
  const rect = e.currentTarget.getBoundingClientRect()
  const cell = pointerToCell(e.clientX, e.clientY, rect, cols, rows)
  if (!cell) {
    // Out of bounds — clear the last cell so a re-entry doesn't
    // draw a line back to the previous interior position.
    lastCellRef.current = null
    return
  }
  const next: [number, number] = [cell.col, cell.row]
  const last = lastCellRef.current
  if (last) {
    if (last[0] === next[0] && last[1] === next[1]) {
      // Same cell — dispatch anyway so a cell killed by Conway
      // between two pointermoves can be revived.
      dispatch({ type: "DRAW", cells: [next] })
      lastCellRef.current = next
      return
    }
    dispatch({
      type: "DRAW",
      cells: drawLine(last[0], last[1], next[0], next[1]),
    })
  } else {
    dispatch({ type: "DRAW", cells: [next] })
  }
  lastCellRef.current = next
}

const handlePointerEnd = (
  e: React.PointerEvent<SVGSVGElement>,
  isDrawingRef: React.MutableRefObject<boolean>,
  lastCellRef: React.MutableRefObject<[number, number] | null>,
  pointerIdRef: React.MutableRefObject<number | null>,
  svgRef: React.RefObject<SVGSVGElement | null>,
) => {
  if (pointerIdRef.current !== e.pointerId) return
  const svg = svgRef.current
  if (svg && svg.hasPointerCapture(e.pointerId)) {
    try {
      svg.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }
  pointerIdRef.current = null
  isDrawingRef.current = false
  lastCellRef.current = null
}

// ----------------------------------------------------------------------
// Keyboard handler — focusable cursor + Space / Enter to draw. The
// cursor is initialised at the centre of the grid the first time the
// wrapper takes focus or an arrow key is pressed.
// ----------------------------------------------------------------------

const handleKeyDown = (
  e: React.KeyboardEvent<HTMLDivElement>,
  cols: number,
  rows: number,
  cursor: [number, number] | null,
  setCursor: React.Dispatch<React.SetStateAction<[number, number] | null>>,
  dispatch: React.Dispatch<SimAction>,
) => {
  if (cols < 3 || rows < 1) return
  const isArrow =
    e.key === "ArrowUp" ||
    e.key === "ArrowDown" ||
    e.key === "ArrowLeft" ||
    e.key === "ArrowRight"
  const isActivate = e.key === " " || e.key === "Enter"
  if (!isArrow && !isActivate) return
  e.preventDefault()
  const current: [number, number] = cursor ?? [
    Math.floor(cols / 2),
    Math.floor(rows / 2),
  ]
  if (isActivate) {
    dispatch({ type: "DRAW", cells: [current] })
    setCursor(current)
    return
  }
  let next: [number, number] = current
  if (e.key === "ArrowUp") next = [current[0], Math.max(0, current[1] - 1)]
  else if (e.key === "ArrowDown")
    next = [current[0], Math.min(rows - 1, current[1] + 1)]
  else if (e.key === "ArrowLeft")
    next = [Math.max(0, current[0] - 1), current[1]]
  else if (e.key === "ArrowRight")
    next = [Math.min(cols - 1, current[0] + 1), current[1]]
  setCursor(next)
}

// ----------------------------------------------------------------------
// ConwayBand — the only component the footer imports. Renders the
// interactive grid. Keys <ConwayGrid /> by pathname so every
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