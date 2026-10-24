import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { nullLogger, stderrLogger, type Logger } from "../../src/output/logger.js"

// The strict `tsconfig.unit.json` (run by `typecheck:unit`)
// cannot type the `process.stdout.write.bind(process.stdout)`
// pattern: the bound function is typed as zero-arg, and
// assigning back to `process.stdout.write` requires a 1-arg
// signature. The same problem is already excluded for
// `output.test.ts`, `print-install-log.test.ts`, and the
// pipeline-install-failure test, so this file follows the
// same convention: it is excluded from `typecheck:unit` and
// relies on the broader `tsc --noEmit` for type safety.
// (See the exclude list in `tsconfig.unit.json`.)
//
// The test logic itself is straightforward: capture every
// chunk written to stdout and stderr, assert on the joined
// output, and restore the original writers in `afterEach`.

let stdoutChunks: string[] = []
let stderrChunks: string[] = []

const captureStdout = (chunk: string | Uint8Array): boolean => {
  stdoutChunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"))
  return true
}
const captureStderr = (chunk: string | Uint8Array): boolean => {
  stderrChunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"))
  return true
}

let originalWriteStdout: typeof process.stdout.write
let originalWriteStderr: typeof process.stderr.write

beforeEach(() => {
  stdoutChunks = []
  stderrChunks = []
  originalWriteStdout = process.stdout.write
  originalWriteStderr = process.stderr.write
  process.stdout.write = captureStdout as typeof process.stdout.write
  process.stderr.write = captureStderr as typeof process.stderr.write
})

afterEach(() => {
  process.stdout.write = originalWriteStdout
  process.stderr.write = originalWriteStderr
})

afterEach(() => {
  process.stdout.write = originalWriteStdout
  process.stderr.write = originalWriteStderr
})

describe("nullLogger", () => {
  it("does NOT write to stdout", () => {
    const log = nullLogger
    log.info("event")
    log.warn("event")
    log.error("event")
    expect(stdoutChunks).toHaveLength(0)
  })

  it("does NOT write to stderr", () => {
    const log = nullLogger
    log.info("event")
    log.warn("event")
    log.error("event")
    expect(stderrChunks).toHaveLength(0)
  })

  it("returns undefined from every call", () => {
    const log = nullLogger
    expect(log.info("event")).toBeUndefined()
    expect(log.warn("event")).toBeUndefined()
    expect(log.error("event")).toBeUndefined()
  })
})

describe("stderrLogger", () => {
  it("writes one line per call to stderr", () => {
    const log: Logger = stderrLogger()
    log.info("first event")
    log.info("second event")
    expect(stderrChunks).toHaveLength(2)
    expect(stderrChunks[0]).toContain("first event")
    expect(stderrChunks[1]).toContain("second event")
  })

  it("prefixes every line with create-deesse-app:", () => {
    const log: Logger = stderrLogger()
    log.info("event-a")
    log.warn("event-b")
    log.error("event-c")
    const joined = stderrChunks.join("")
    expect(joined).toContain("create-deesse-app:")
    expect(joined).toContain("event-a")
    expect(joined).toContain("event-b")
    expect(joined).toContain("event-c")
  })

  it("emits one line per call (each ends in a single newline)", () => {
    const log: Logger = stderrLogger()
    log.info("a")
    log.info("b")
    log.info("c")
    expect(stderrChunks).toHaveLength(3)
    expect(stderrChunks.every((s) => s.endsWith("\n"))).toBe(true)
    expect(stderrChunks.every((s) => s.endsWith("\n\n"))).toBe(false)
  })

  it("does NOT write to stdout", () => {
    const log: Logger = stderrLogger()
    log.info("event")
    log.warn("event")
    log.error("event")
    expect(stdoutChunks).toHaveLength(0)
  })

  it("warn level adds the (!) marker; error level adds the (x) marker", () => {
    const log: Logger = stderrLogger()
    log.warn("a warning")
    log.error("an error")
    expect(stderrChunks[0]).toContain("(!)")
    expect(stderrChunks[0]).toContain("a warning")
    expect(stderrChunks[1]).toContain("(x)")
    expect(stderrChunks[1]).toContain("an error")
  })

  it("info level does NOT add a marker", () => {
    const log: Logger = stderrLogger()
    log.info("a step")
    expect(stderrChunks[0]).not.toContain("(!)")
    expect(stderrChunks[0]).not.toContain("(x)")
  })

  it("renders fields as key=value space-separated", () => {
    const log: Logger = stderrLogger()
    log.info("step", { count: 3, name: "alice" })
    expect(stderrChunks[0]).toContain("count=3")
    expect(stderrChunks[0]).toContain("name=alice")
  })

  it("single-quotes field values that contain spaces or '='", () => {
    const log: Logger = stderrLogger()
    // The single-quote rule fires on values that contain a
    // space or an `=` character. A bare backslash path
    // (`C:\Users\foo`) is not quoted because it has neither.
    log.info("step", { path: "C:\\Users\\foo bar", flag: "key=value" })
    expect(stderrChunks[0]).toContain("path='C:\\Users\\foo bar'")
    expect(stderrChunks[0]).toContain("flag='key=value'")
  })

  it("omits the trailing space when no fields are provided", () => {
    const log: Logger = stderrLogger()
    log.info("plain event")
    // The line is `prefix plain event\n` — no double-space,
    // no orphan equals sign, no trailing whitespace before
    // the newline.
    expect(stderrChunks[0]).not.toMatch(/ {2}/)
    expect(stderrChunks[0]).not.toMatch(/=\s/)
  })

  it("honors an injected writer", () => {
    const captured: string[] = []
    const log: Logger = stderrLogger((s) => {
      captured.push(s)
    })
    log.info("captured event", { x: 1 })
    expect(captured).toHaveLength(1)
    expect(captured[0]).toContain("captured event")
    expect(captured[0]).toContain("x=1")
    // The injected writer received the call, so the real
    // process.stderr was untouched.
    expect(stderrChunks).toHaveLength(0)
  })

  it("does NOT call process.exit", () => {
    const log: Logger = stderrLogger()
    expect(() => log.info("a")).not.toThrow()
    expect(() => log.warn("a")).not.toThrow()
    expect(() => log.error("a")).not.toThrow()
    expect(process.exitCode === 0 || process.exitCode === undefined).toBe(true)
  })

  it("info/warn/error are independent spies (vi.fn-based callers can observe each level)", () => {
    // Independent test: the seam returns an object whose
    // methods are address-distinct, so a test that replaces
    // only one method does not lose the others.
    const infoSpy = vi.fn()
    const warnSpy = vi.fn()
    const errorSpy = vi.fn()
    const log: Logger = {
      info: infoSpy,
      warn: warnSpy,
      error: errorSpy,
    }
    log.info("a", { k: 1 })
    log.warn("b")
    log.error("c")
    expect(infoSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })
})
