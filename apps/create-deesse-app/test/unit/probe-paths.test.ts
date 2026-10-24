import { describe, expect, it } from "vitest"

import {
  probeInstallPrereqs,
  type SyncRunner,
  type SyncRunnerResult,
} from "../../src/pm/probe-paths.js"

const ok = (): SyncRunnerResult => ({ status: 0, output: "", signal: null })
const missing = (): SyncRunnerResult => ({
  status: 1,
  output: "not found",
  signal: null,
})
const timeout = (): SyncRunnerResult => ({
  status: null,
  output: "",
  signal: "SIGTERM",
})

const stub =
  (matrix: Record<string, SyncRunnerResult>): SyncRunner =>
  (command, args) => {
    if (command === "which" || command === "where") {
      const bin = args[0]
      const r = matrix[bin ?? ""]
      if (r) return r
    }
    return missing()
  }

describe("probeInstallPrereqs", () => {
  it("returns true for each binary the runner reports as present", () => {
    const runner = stub({
      corepack: ok(),
      npm: ok(),
      pnpm: ok(),
    })
    expect(probeInstallPrereqs(runner)).toEqual({
      corepack: true,
      npm: true,
      pnpm: true,
    })
  })

  it("returns false for missing binaries", () => {
    const runner = stub({
      corepack: missing(),
      npm: missing(),
      pnpm: missing(),
    })
    expect(probeInstallPrereqs(runner)).toEqual({
      corepack: false,
      npm: false,
      pnpm: false,
    })
  })

  it("returns false for timed-out probes (status: null)", () => {
    const runner = stub({
      corepack: timeout(),
      npm: timeout(),
      pnpm: timeout(),
    })
    expect(probeInstallPrereqs(runner)).toEqual({
      corepack: false,
      npm: false,
      pnpm: false,
    })
  })

  it("returns the per-binary boolean, not a single combined one", () => {
    const runner = stub({
      corepack: ok(),
      npm: missing(),
      pnpm: ok(),
    })
    expect(probeInstallPrereqs(runner)).toEqual({
      corepack: true,
      npm: false,
      pnpm: true,
    })
  })

  it("uses `which` on POSIX and `where` on Windows", () => {
    const seen: string[] = []
    const runner: SyncRunner = (command, args) => {
      seen.push(`${command}:${args[0]}`)
      return ok()
    }
    probeInstallPrereqs(runner)
    const expected = process.platform === "win32" ? "where" : "which"
    for (const bin of ["corepack", "npm", "pnpm"]) {
      expect(seen).toContain(`${expected}:${bin}`)
    }
  })

  it("never throws on a runner that returns a non-zero status", () => {
    const runner: SyncRunner = () => missing()
    expect(() => probeInstallPrereqs(runner)).not.toThrow()
  })
})
