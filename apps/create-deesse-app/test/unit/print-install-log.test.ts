import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { printInstallLog } from "../../src/output/print-install-log.js"

const originalWriteStderr = process.stderr.write.bind(process.stderr)
let stderrChunks: string[] = []

beforeEach(() => {
  stderrChunks = []
  process.stderr.write = ((chunk: string | Uint8Array): boolean => {
    stderrChunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"))
    return true
  }) as typeof process.stderr.write
})

afterEach(() => {
  process.stderr.write = originalWriteStderr
})

describe("printInstallLog", () => {
  it("writes a human-readable mirror of the install output to stderr", () => {
    printInstallLog({
      code: 1,
      stderr: "ERR_PNPM_PEER_DEP_ISSUES  Unmet peer dependencies",
      stdout: "Lockfile is up to date",
      recovery: "cd my-app && pnpm install",
      destination: "/tmp/my-app",
    })
    const out = stderrChunks.join("")
    expect(out).toContain("pnpm install exited with code 1")
    expect(out).toContain("ERR_PNPM_PEER_DEP_ISSUES")
    expect(out).toContain("Lockfile is up to date")
    expect(out).toContain("cd my-app && pnpm install")
    expect(out).toContain("--- stderr ---")
    expect(out).toContain("--- stdout ---")
    expect(out).toContain("--- recovery ---")
  })

  it("truncates oversized stderr and stdout at 32 KB with a marker", () => {
    const big = "X".repeat(40 * 1024)
    printInstallLog({
      code: 2,
      stderr: big,
      stdout: "",
      recovery: "cd my-app && pnpm install",
      destination: "/tmp/my-app",
    })
    const out = stderrChunks.join("")
    expect(out).toContain("truncated")
    // The full 40KB chunk must NOT have been emitted as-is.
    expect(out.length).toBeLessThan(big.length + 1024)
  })

  it("does NOT write to stdout", () => {
    const originalWriteStdout = process.stdout.write.bind(process.stdout)
    const stdoutChunks: string[] = []
    process.stdout.write = ((chunk: string | Uint8Array): boolean => {
      stdoutChunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"))
      return true
    }) as typeof process.stdout.write
    try {
      printInstallLog({
        code: 1,
        stderr: "x",
        stdout: "y",
        recovery: "cd my-app && pnpm install",
        destination: "/tmp/my-app",
      })
      expect(stdoutChunks).toHaveLength(0)
    } finally {
      process.stdout.write = originalWriteStdout
    }
  })

  it("does NOT call process.exit", () => {
    expect(() =>
      printInstallLog({
        code: 1,
        stderr: "",
        stdout: "",
        recovery: "cd my-app && pnpm install",
        destination: "/tmp/my-app",
      }),
    ).not.toThrow()
  })
})
