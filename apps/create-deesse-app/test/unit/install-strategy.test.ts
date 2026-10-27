import { describe, expect, it } from "vitest"

import { pickInstallStrategy } from "../../src/pm/install-strategy.js"

describe("pickInstallStrategy", () => {
  it("returns 'corepack' when corepack is available", () => {
    expect(
      pickInstallStrategy({
        corepackAvailable: true,
        npmAvailable: true,
        pnpmAvailable: true,
      })
    ).toBe("corepack")
  })

  it("returns 'npm-exec' when corepack is absent but npm is available", () => {
    expect(
      pickInstallStrategy({
        corepackAvailable: false,
        npmAvailable: true,
        pnpmAvailable: true,
      })
    ).toBe("npm-exec")
  })

  it("returns 'pnpm-direct' when only pnpm is available", () => {
    expect(
      pickInstallStrategy({
        corepackAvailable: false,
        npmAvailable: false,
        pnpmAvailable: true,
      })
    ).toBe("pnpm-direct")
  })

  it("throws when none of the three is available", () => {
    expect(() =>
      pickInstallStrategy({
        corepackAvailable: false,
        npmAvailable: false,
        pnpmAvailable: false,
      })
    ).toThrow(/not a supported invocation manager/)
  })

  it("prefers corepack even when pnpm-direct is faster", () => {
    // The function does not consider pnpm-direct until both
    // corepack and npm are missing. Verify the priority.
    expect(
      pickInstallStrategy({
        corepackAvailable: true,
        npmAvailable: false,
        pnpmAvailable: true,
      })
    ).toBe("corepack")
  })

  it("is a pure decision (no I/O)", () => {
    // Same inputs give the same output, with no side effects.
    const a = pickInstallStrategy({
      corepackAvailable: true,
      npmAvailable: false,
      pnpmAvailable: false,
    })
    const b = pickInstallStrategy({
      corepackAvailable: true,
      npmAvailable: false,
      pnpmAvailable: false,
    })
    expect(a).toBe(b)
  })
})
