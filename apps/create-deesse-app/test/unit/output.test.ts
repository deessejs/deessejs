import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { CliError } from "../../src/errors/index.js"
import { printError, printResult } from "../../src/output/index.js"

const originalWriteStdout = process.stdout.write.bind(process.stdout)
const originalWriteStderr = process.stderr.write.bind(process.stderr)

let stdoutChunks: string[] = []
let stderrChunks: string[] = []

beforeEach(() => {
  stdoutChunks = []
  stderrChunks = []
  process.stdout.write = ((chunk: string | Uint8Array): boolean => {
    stdoutChunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"))
    return true
  }) as typeof process.stdout.write
  process.stderr.write = ((chunk: string | Uint8Array): boolean => {
    stderrChunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"))
    return true
  }) as typeof process.stderr.write
})

afterEach(() => {
  process.stdout.write = originalWriteStdout
  process.stderr.write = originalWriteStderr
})

describe("printResult", () => {
  it("writes one JSON object followed by a newline to stdout", () => {
    printResult({ ok: true, mode: "create" })
    const joined = stdoutChunks.join("")
    expect(joined.endsWith("\n")).toBe(true)
    const parsed = JSON.parse(joined.trim())
    expect(parsed).toEqual({ ok: true, mode: "create" })
  })

  it("pretty-prints with two-space indent", () => {
    printResult({ ok: true, list: [1, 2] })
    const joined = stdoutChunks.join("")
    expect(joined).toContain('  "list"')
  })

  it("does NOT call process.exit", () => {
    // Spy: if printResult called process.exit, afterEach would still run,
    // but the process would be terminated — so reaching this assertion
    // proves the function returns normally.
    expect(() => printResult({ ok: true })).not.toThrow()
    expect(process.exitCode === 0 || process.exitCode === undefined).toBe(true)
  })

  it("does NOT write to stderr", () => {
    printResult({ ok: true })
    expect(stderrChunks).toHaveLength(0)
  })
})

describe("printError", () => {
  it("writes Error/Hint/Code lines to stderr", () => {
    const err = new CliError("install_failed", "boom", "try this")
    printError(err)
    const joined = stderrChunks.join("")
    expect(joined).toContain("Error")
    expect(joined).toContain("boom")
    expect(joined).toContain("Hint")
    expect(joined).toContain("try this")
    expect(joined).toContain("Code")
    expect(joined).toContain("install_failed")
  })

  it("omits the Hint line when hint is undefined", () => {
    const err = new CliError("internal", "boom")
    printError(err)
    const joined = stderrChunks.join("")
    expect(joined).toContain("Error")
    expect(joined).toContain("Code")
    expect(joined).not.toContain("Hint")
  })

  it("does NOT write to stdout", () => {
    const err = new CliError("internal", "boom")
    printError(err)
    expect(stdoutChunks).toHaveLength(0)
  })

  it("does NOT call process.exit", () => {
    expect(() => printError(new CliError("internal", "boom"))).not.toThrow()
  })
})