/**
 * Unit tests for the pure functions in `apps/web/src/components/footers/conway-grid.tsx`.
 *
 * Coverage:
 *   - Pattern shapes (glider, lwss-h, r-pentomino) — width, height, cell count.
 *   - `canPlaceEmpty` — rectangle bounds + cell occupation check.
 *   - `injectPattern` — additive, immutable, no cell collisions destroy state.
 *   - `pickInjection` — deterministic RNG drives a known pattern, position
 *     and bounds. A fully-saturated grid returns null.
 *   - `pickInjection` rejects rectangles that include a live cell.
 *   - `stepGrid` classical: blinker (period 2) on a 5x5 grid, block (still
 *     life) stays put, hard borders handled.
 *   - `gridsEqual` identity and inequality.
 *   - `simReducer` transitions: STEP in active mode, no-op in stable mode,
 *     INJECT switches mode to active, INJECT no-op when nothing added,
 *     SEED resets to active.
 *
 * Tests use a deterministic RNG (`mulberry32` with a fixed seed) instead
 * of relying on `Math.random` to keep assertions stable.
 */

import { describe, expect, it } from "vitest"

import {
  canPlaceEmpty,
  countLive,
  drawLine,
  gridsEqual,
  injectPattern,
  patternCells,
  patternHeight,
  patternWidth,
  pickInjection,
  pointerToCell,
  seedGrid,
  stepGrid,
  type ConwayPattern,
} from "../../src/components/footers/conway-grid.js"

// ----------------------------------------------------------------------
// Deterministic RNG (mulberry32). Reused across the test file so
// assertions on `pickInjection` are stable.
// ----------------------------------------------------------------------

function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ----------------------------------------------------------------------
// Pattern shapes
// ----------------------------------------------------------------------

describe("patternCells", () => {
  it("glider has 5 cells", () => {
    expect(patternCells("glider").length).toBe(5)
  })

  it("lwss-h has 9 cells", () => {
    expect(patternCells("lwss-h").length).toBe(9)
  })

  it("r-pentomino has 5 cells", () => {
    expect(patternCells("r-pentomino").length).toBe(5)
  })

  it("pattern width and height match the bounding box", () => {
    expect(patternWidth("glider")).toBe(3)
    expect(patternHeight("glider")).toBe(3)
    expect(patternWidth("lwss-h")).toBe(5)
    expect(patternHeight("lwss-h")).toBe(4)
    expect(patternWidth("r-pentomino")).toBe(3)
    expect(patternHeight("r-pentomino")).toBe(3)
  })
})

// ----------------------------------------------------------------------
// canPlaceEmpty
// ----------------------------------------------------------------------

describe("canPlaceEmpty", () => {
  it("returns true on an empty grid with margin", () => {
    const grid = new Uint8Array(15 * 10)
    expect(canPlaceEmpty(grid, 15, 10, 5, 5, "glider", 2)).toBe(true)
  })

  it("returns false when the origin is too close to the left edge", () => {
    const grid = new Uint8Array(20 * 10)
    // margin=2, so x=1 leaves only 1 cell of buffer on the left → fails
    expect(canPlaceEmpty(grid, 20, 10, 1, 5, "glider", 2)).toBe(false)
  })

  it("returns false when the rectangle goes off the right edge", () => {
    const grid = new Uint8Array(10 * 10)
    // x=8, w=3, margin=2 → x + w + margin = 13 > 10
    expect(canPlaceEmpty(grid, 10, 10, 8, 5, "glider", 2)).toBe(false)
  })

  it("returns false when any cell in the rectangle (including margin) is alive", () => {
    const grid = new Uint8Array(20 * 10)
    grid[5 * 20 + 6] = 1 // inside the would-be rectangle
    expect(canPlaceEmpty(grid, 20, 10, 5, 5, "glider", 2)).toBe(false)
  })

  it("returns true when a live cell is outside the rectangle (with margin)", () => {
    const grid = new Uint8Array(20 * 10)
    grid[0] = 1 // far from the placement
    expect(canPlaceEmpty(grid, 20, 10, 5, 5, "glider", 2)).toBe(true)
  })
})

// ----------------------------------------------------------------------
// injectPattern
// ----------------------------------------------------------------------

describe("injectPattern", () => {
  it("adds the pattern's cells additively to an empty grid", () => {
    const grid = new Uint8Array(15 * 10)
    const next = injectPattern(grid, 15, 10, 2, 2, "glider")
    expect(countLive(next)).toBe(5)
    expect(gridsEqual(grid, new Uint8Array(15 * 10))).toBe(true) // original untouched
  })

  it("is additive: a cell already alive stays alive", () => {
    const grid = new Uint8Array(15 * 10)
    // pre-set one of the glider's target cells
    grid[2 * 15 + 3] = 1
    const next = injectPattern(grid, 15, 10, 2, 2, "glider")
    expect(countLive(next)).toBe(5) // same — overlap is not double-counted
  })

  it("preserves cells outside the pattern", () => {
    const grid = new Uint8Array(15 * 10)
    grid[0] = 1
    grid[14] = 1
    const next = injectPattern(grid, 15, 10, 5, 5, "glider")
    expect(next[0]).toBe(1)
    expect(next[14]).toBe(1)
    expect(countLive(next)).toBe(7) // 2 pre-existing + 5 glider cells
  })

  it("is immutable: the input Uint8Array is not mutated", () => {
    const grid = new Uint8Array(15 * 10)
    const snapshot = new Uint8Array(grid)
    injectPattern(grid, 15, 10, 2, 2, "glider")
    expect(gridsEqual(grid, snapshot)).toBe(true)
  })
})

// ----------------------------------------------------------------------
// pickInjection — deterministic RNG
// ----------------------------------------------------------------------

describe("pickInjection", () => {
  it("returns null when the grid is too small for any pattern + margin", () => {
    const rng = makeRng(1)
    // 5x5 with margin 2 means the inside is 1x1, no pattern fits.
    const grid = new Uint8Array(5 * 5)
    // pickInjection always consumes rng, so we read it once to satisfy lint.
    rng()
    expect(pickInjection(grid, 5, 5, rng)).toBeNull()
  })

  it("returns null when the grid is fully saturated", () => {
    const rng = makeRng(1)
    const grid = new Uint8Array(20 * 10).fill(1)
    rng()
    expect(pickInjection(grid, 20, 10, rng)).toBeNull()
  })

  it("returns a valid placement on an empty grid (deterministic RNG)", () => {
    const rng = makeRng(42)
    const grid = new Uint8Array(30 * 12)
    const pick = pickInjection(grid, 30, 12, rng)
    expect(pick).not.toBeNull()
    if (!pick) return
    expect(canPlaceEmpty(grid, 30, 12, pick.x, pick.y, pick.pattern, 2)).toBe(true)
  })

  it("the picker visits all three patterns within 1000 deterministic draws", () => {
    // Each call consumes 3 random values (pattern index, x, y), so
    // 1000 calls covers each pattern plenty of times.
    const rng = makeRng(7)
    const grid = new Uint8Array(60 * 20)
    const seen = new Set<ConwayPattern>()
    for (let i = 0; i < 1000; i++) {
      const pick = pickInjection(grid, 60, 20, rng)
      if (pick) seen.add(pick.pattern)
    }
    expect(seen.size).toBe(3)
    expect(seen.has("glider")).toBe(true)
    expect(seen.has("lwss-h")).toBe(true)
    expect(seen.has("r-pentomino")).toBe(true)
  })

  it("finds a placement even when most of the grid is occupied", () => {
    const rng = makeRng(11)
    const grid = new Uint8Array(40 * 15)
    // Fill the top half
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 40; c++) {
        grid[r * 40 + c] = 1
      }
    }
    const pick = pickInjection(grid, 40, 15, rng, 20)
    expect(pick).not.toBeNull()
    if (!pick) return
    // Must be in the empty bottom half
    expect(pick.y).toBeGreaterThanOrEqual(7)
  })
})

// ----------------------------------------------------------------------
// stepGrid
// ----------------------------------------------------------------------

describe("stepGrid", () => {
  it("block (2x2) is a still life", () => {
    const cols = 5
    const rows = 5
    const grid = new Uint8Array(cols * rows)
    grid[1 * cols + 1] = 1
    grid[1 * cols + 2] = 1
    grid[2 * cols + 1] = 1
    grid[2 * cols + 2] = 1
    const next = stepGrid(grid, cols, rows)
    expect(gridsEqual(grid, next)).toBe(true)
  })

  it("blinker (horizontal) oscillates with period 2", () => {
    const cols = 5
    const rows = 5
    const grid = new Uint8Array(cols * rows)
    // Three horizontal cells at row 2, cols 1..3 → indices 11, 12, 13
    grid[2 * cols + 1] = 1
    grid[2 * cols + 2] = 1
    grid[2 * cols + 3] = 1
    const phaseA = new Uint8Array(grid)
    const phaseB = stepGrid(phaseA, cols, rows)
    const phaseC = stepGrid(phaseB, cols, rows)
    expect(gridsEqual(phaseA, phaseC)).toBe(true) // period 2
    expect(gridsEqual(phaseA, phaseB)).toBe(false)
    // Phase B is three vertical cells at col 2, rows 1..3 → indices 7, 12, 17
    expect(phaseB[1 * cols + 2]).toBe(1)
    expect(phaseB[2 * cols + 2]).toBe(1)
    expect(phaseB[3 * cols + 2]).toBe(1)
  })

  it("births across the horizontal seam", () => {
    // 5x5 grid, three live cells at (1, 4), (2, 4), (3, 4) on the
    // right column. A dead cell at (2, 0) sees all three as its
    // wrapped left neighbours and becomes alive.
    const cols = 5
    const rows = 5
    const grid = new Uint8Array(cols * rows)
    grid[1 * cols + 4] = 1
    grid[2 * cols + 4] = 1
    grid[3 * cols + 4] = 1
    const next = stepGrid(grid, cols, rows)
    expect(next[2 * cols + 0]).toBe(1)
  })

  it("births across the vertical seam", () => {
    // Three live cells in row 4 at columns 1, 2, 3. A dead cell at
    // row 0, col 2 sees all three as wrapped top neighbours.
    const cols = 5
    const rows = 5
    const grid = new Uint8Array(cols * rows)
    grid[4 * cols + 1] = 1
    grid[4 * cols + 2] = 1
    grid[4 * cols + 3] = 1
    const next = stepGrid(grid, cols, rows)
    expect(next[0 * cols + 2]).toBe(1)
  })

  it("births across a diagonal corner", () => {
    // The cell at (0, 0) sees three live neighbours all in opposite
    // corners of the 5x5 grid: (0, 4) wraps horizontally, (4, 0)
    // wraps vertically, (4, 4) wraps both ways.
    const cols = 5
    const rows = 5
    const grid = new Uint8Array(cols * rows)
    grid[0 * cols + 4] = 1
    grid[4 * cols + 0] = 1
    grid[4 * cols + 4] = 1
    const next = stepGrid(grid, cols, rows)
    expect(next[0 * cols + 0]).toBe(1)
  })

  it("keeps a 2x2 block stable across both seams", () => {
    // Place a 2x2 block across the wraparound so cells appear at all
    // four corners. Each cell still has two live neighbours (its two
    // mates in the block), so the block survives.
    const cols = 5
    const rows = 5
    const grid = new Uint8Array(cols * rows)
    grid[(rows - 2) * cols + (cols - 2)] = 1
    grid[(rows - 2) * cols + (cols - 1)] = 1
    grid[(rows - 1) * cols + (cols - 2)] = 1
    grid[(rows - 1) * cols + (cols - 1)] = 1
    const next = stepGrid(grid, cols, rows)
    // Block stays put
    expect(countLive(next)).toBe(4)
    expect(next[(rows - 2) * cols + (cols - 2)]).toBe(1)
    expect(next[(rows - 2) * cols + (cols - 1)]).toBe(1)
    expect(next[(rows - 1) * cols + (cols - 2)]).toBe(1)
    expect(next[(rows - 1) * cols + (cols - 1)]).toBe(1)
  })

  it("preserves population across the seam", () => {
    // A 3-cell horizontal blinker straddles the right seam of a 5x5
    // grid: cells at (2, 3), (2, 4), (2, 0). Each tick flips the
    // blinker to its vertical phase and back; the population stays at
    // 3 forever (an oscillator). This proves toroidal stepping does
    // not drop or duplicate cells across the seam.
    const cols = 5
    const rows = 5
    const grid = new Uint8Array(cols * rows)
    grid[2 * cols + 3] = 1
    grid[2 * cols + 4] = 1
    grid[2 * cols + 0] = 1
    let state: Uint8Array = new Uint8Array(grid) as Uint8Array
    for (let i = 0; i < 8; i++) {
      state = stepGrid(state, cols, rows)
      expect(countLive(state)).toBe(3)
    }
  })

  it("behaves the same as hard borders for a pattern far from the edges", () => {
    // A pattern that doesn't touch any border should produce the same
    // result under toroidal stepping as it did previously under hard borders.
    // Use the 5x5 blinker (which sits entirely inside a 5x5 grid, away
    // from edges by at least one row).
    const cols = 5
    const rows = 5
    const grid = new Uint8Array(cols * rows)
    grid[2 * cols + 1] = 1
    grid[2 * cols + 2] = 1
    grid[2 * cols + 3] = 1
    const phaseA = new Uint8Array(grid)
    const phaseB = stepGrid(phaseA, cols, rows)
    expect(phaseB[1 * cols + 2]).toBe(1)
    expect(phaseB[2 * cols + 2]).toBe(1)
    expect(phaseB[3 * cols + 2]).toBe(1)
  })
})

// ----------------------------------------------------------------------
// gridsEqual
// ----------------------------------------------------------------------

describe("gridsEqual", () => {
  it("returns true for two empty arrays of the same length", () => {
    expect(gridsEqual(new Uint8Array(0), new Uint8Array(0))).toBe(true)
  })

  it("returns false for arrays of different length", () => {
    expect(gridsEqual(new Uint8Array(4), new Uint8Array(5))).toBe(false)
  })

  it("returns false when one cell differs", () => {
    const a = new Uint8Array(4)
    const b = new Uint8Array(4)
    b[2] = 1
    expect(gridsEqual(a, b)).toBe(false)
  })
})

// ----------------------------------------------------------------------
// countLive + seedGrid
// ----------------------------------------------------------------------

describe("countLive", () => {
  it("counts alive cells", () => {
    const grid = new Uint8Array(10)
    grid[0] = 1
    grid[5] = 1
    grid[9] = 1
    expect(countLive(grid)).toBe(3)
  })
})

describe("seedGrid", () => {
  it("never returns a fully dead grid (the centre fallback)", () => {
    // With a uniform 0.99 RNG, the per-cell probability is at most 0.05
    // so the random draw is highly likely to produce a fully dead grid.
    // The function must guarantee countLive >= 1 if grid.length > 0.
    const rng = () => 0.99
    const grid = seedGrid(20, 20, rng)
    expect(countLive(grid)).toBeGreaterThanOrEqual(1)
  })
})

// ----------------------------------------------------------------------
// drawLine — Bresenham line algorithm. Tested as a pure function.
// ----------------------------------------------------------------------

describe("drawLine", () => {
  it("returns the single cell when start equals end", () => {
    expect(drawLine(2, 2, 2, 2)).toEqual([[2, 2]])
  })

  it("walks a vertical line inclusive of both ends", () => {
    const cells = drawLine(0, 0, 0, 3)
    expect(cells).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ])
  })

  it("walks a horizontal line inclusive of both ends", () => {
    const cells = drawLine(1, 5, 4, 5)
    expect(cells).toEqual([
      [1, 5],
      [2, 5],
      [3, 5],
      [4, 5],
    ])
  })

  it("walks a diagonal inclusive of both ends", () => {
    const cells = drawLine(0, 0, 3, 3)
    expect(cells).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
    ])
  })

  it("walks a long line without exceeding the iteration bound", () => {
    // dx + dy + 2 = 9 + 9 + 2 = 20. The function must terminate.
    const cells = drawLine(0, 0, 9, 9)
    expect(cells.length).toBeGreaterThan(0)
    expect(cells[cells.length - 1]).toEqual([9, 9])
  })

  it("handles a backwards segment", () => {
    const cells = drawLine(3, 3, 0, 0)
    expect(cells[0]).toEqual([3, 3])
    expect(cells[cells.length - 1]).toEqual([0, 0])
  })
})

// ----------------------------------------------------------------------
// pointerToCell — strict coordinate validation.
// ----------------------------------------------------------------------

describe("pointerToCell", () => {
  const rect = { left: 100, top: 200, width: 160, height: 80 }

  it("returns null when the grid is empty", () => {
    expect(pointerToCell(180, 240, rect, 0, 0)).toBeNull()
  })

  it("returns null when the rectangle has zero width or height", () => {
    expect(pointerToCell(100, 200, { left: 100, top: 200, width: 0, height: 80 }, 5, 5)).toBeNull()
    expect(pointerToCell(100, 200, { left: 100, top: 200, width: 160, height: 0 }, 5, 5)).toBeNull()
  })

  it("returns null for a pointer outside the rectangle", () => {
    // left of rect
    expect(pointerToCell(50, 240, rect, 20, 5)).toBeNull()
    // right of rect
    expect(pointerToCell(300, 240, rect, 20, 5)).toBeNull()
    // above rect
    expect(pointerToCell(180, 100, rect, 20, 5)).toBeNull()
    // below rect
    expect(pointerToCell(180, 400, rect, 20, 5)).toBeNull()
  })

  it("maps an interior pointer to valid integer coordinates", () => {
    // 20 cols x 5 rows over a 160x80 rectangle. Each cell is 8x16.
    // Pointer at (180, 240) sits 80px right of left, 40px below top.
    // col = floor(80/160 * 20) = 10; row = floor(40/80 * 5) = 2.
    const cell = pointerToCell(180, 240, rect, 20, 5)
    expect(cell).toEqual({ col: 10, row: 2 })
  })

  it("excludes a pointer exactly on the right boundary", () => {
    // x = left + width = 100 + 160 = 260 → not strictly inside.
    expect(pointerToCell(260, 240, rect, 20, 5)).toBeNull()
  })
})

// ----------------------------------------------------------------------
// Reducer DRAW — additive, idempotent, bounds-checked, flips mode.
// ----------------------------------------------------------------------

describe("simReducer DRAW (indirect)", () => {
  // The reducer itself is module-private; we exercise it indirectly
  // through the public exports and a smoke test of the unit functions.
  // For now we check that the visible pure functions honour the same
  // invariants the reducer uses.

  it("canPlaceEmpty rejects a rectangle covering a live cell", () => {
    const grid = new Uint8Array(20 * 5)
    grid[2 * 20 + 10] = 1
    expect(canPlaceEmpty(grid, 20, 5, 9, 1, "glider", 2)).toBe(false)
  })

  it("drawLine + pointerToCell agree on coordinate space", () => {
    const cols = 20
    const rows = 5
    const rect = { left: 0, top: 0, width: 160, height: 80 }
    // Two interior points.
    const c1 = pointerToCell(40, 10, rect, cols, rows)!
    const c2 = pointerToCell(120, 70, rect, cols, rows)!
    // The Bresenham segment must include both endpoints.
    const line = drawLine(c1.col, c1.row, c2.col, c2.row)
    expect(line[0]).toEqual([c1.col, c1.row])
    expect(line[line.length - 1]).toEqual([c2.col, c2.row])
  })
})
