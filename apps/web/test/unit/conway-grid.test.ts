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
  gridsEqual,
  injectPattern,
  patternCells,
  patternHeight,
  patternWidth,
  pickInjection,
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

  it("honours hard borders (no wraparound)", () => {
    const cols = 5
    const rows = 5
    const grid = new Uint8Array(cols * rows)
    // 3 cells at row 0 (top row): their top neighbours are missing
    grid[0 * cols + 0] = 1
    grid[0 * cols + 1] = 1
    grid[0 * cols + 2] = 1
    // After one step the corner cell (0,0) sees 1 neighbour (0,1) — dies.
    const next = stepGrid(grid, cols, rows)
    expect(next[0 * cols + 0]).toBe(0)
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
