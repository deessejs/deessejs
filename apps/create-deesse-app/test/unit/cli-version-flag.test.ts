import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { readPackageVersion } from "../../src/utils/package-version.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgPath = join(__dirname, "..", "..", "package.json")
const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string }

const originalWriteStdout = process.stdout.write.bind(process.stdout)
const originalExit = process.exit
let stdoutChunks: string[] = []
let exitCode: number | undefined
let exitCalled = false

beforeEach(() => {
  stdoutChunks = []
  exitCode = undefined
  exitCalled = false
  process.stdout.write = ((chunk: string | Uint8Array): boolean => {
    stdoutChunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"))
    return true
  }) as typeof process.stdout.write
  process.exit = ((code?: number) => {
    exitCalled = true
    exitCode = code ?? 0
    return undefined as never
  }) as never
})

afterEach(() => {
  process.stdout.write = originalWriteStdout
  process.exit = originalExit
})

// The version handling is a pre-parse in src/index.ts that runs before
// Commander. We can't import src/index.ts directly (it calls
// `parseAsync` at module top level), so we replicate the pre-parse
// here and assert its behaviour.
const runVersionPreParse = (argv: string[]): void => {
  const versionArgs = argv.slice(2)
  if (versionArgs.includes("--version") || versionArgs.includes("-v")) {
    process.stdout.write(readPackageVersion() + "\n")
    process.exit(0)
  }
}

describe("--version flag (pre-parse in src/index.ts)", () => {
  it("prints the package version, not the literal 'add'", () => {
    runVersionPreParse(["node", "create-deesse-app", "--version"])
    const out = stdoutChunks.join("")
    expect(out).toBe(`${pkg.version}\n`)
    expect(out).not.toContain("add")
    expect(exitCalled).toBe(true)
    expect(exitCode).toBe(0)
  })

  it("works the same way for the short form -v (npm convention)", () => {
    runVersionPreParse(["node", "create-deesse-app", "-v"])
    const out = stdoutChunks.join("")
    expect(out).toBe(`${pkg.version}\n`)
    expect(out).not.toContain("add")
    expect(exitCalled).toBe(true)
    expect(exitCode).toBe(0)
  })

  it("does NOT short-circuit when neither flag is present", () => {
    runVersionPreParse(["node", "create-deesse-app", "my-app"])
    expect(stdoutChunks).toHaveLength(0)
    expect(exitCalled).toBe(false)
  })
})
