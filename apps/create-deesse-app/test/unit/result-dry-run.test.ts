import { describe, expect, it } from "vitest"

import { buildDryRunResult } from "../../src/dry-run/build-dry-run-result.js"
import type { CreateDryRunResult, DryRunInstall } from "../../src/result.js"

const sha = "abcdef0123456789abcdef0123456789abcdef01"
const destination = "/tmp/cda-dry"
const packageName = { previous: "next-monorepo", current: "my-app" }
const entries = [
  { path: "LICENSE", size: 3, mode: 0o644 },
  { path: "package.json", size: 12, mode: 0o644 },
]

describe("buildDryRunResult", () => {
  it("returns the full JSON shape with install.skipped:false when --install", () => {
    const result: CreateDryRunResult = buildDryRunResult({
      sha,
      destination,
      packageName,
      entries,
      install: true,
      prereqs: { corepack: true, npm: true, pnpm: false },
      strategy: "corepack",
      installCommand: { bin: "corepack", args: ["pnpm", "install"] },
      pnpmVersion: "11.0.0",
    })

    expect(result.ok).toBe(true)
    expect(result.mode).toBe("dry-run")
    expect(result.projectCreated).toBe(false)
    expect(result.installed).toBe(false)
    expect(result.source.sha).toBe(sha)
    expect(result.destination).toBe(destination)
    expect(result.packageName).toEqual(packageName)
    expect(result.packageManager).toBe("pnpm")
    expect(result.documentation).toBe(
      "https://docs.deessejs.com/getting-started"
    )
    expect(result.recovery).toBeNull()
    expect(result.plannedFiles).toEqual(entries)

    const install: DryRunInstall = result.install
    expect(install.skipped).toBe(false)
    if (install.skipped) return
    expect(install.strategy).toBe("corepack")
    expect(install.command).toEqual({
      bin: "corepack",
      args: ["pnpm", "install"],
    })
    expect(install.prereqs).toEqual({
      corepack: true,
      npm: true,
      pnpm: false,
    })
  })

  it("returns install.skipped:true with no strategy/command/prereqs when --no-install", () => {
    const result: CreateDryRunResult = buildDryRunResult({
      sha,
      destination,
      packageName,
      entries,
      install: false,
      prereqs: undefined,
      strategy: undefined,
      installCommand: undefined,
      pnpmVersion: undefined,
    })

    expect(result.ok).toBe(true)
    expect(result.install.skipped).toBe(true)
    // The discriminated union narrows: when skipped is
    // true, the strategy/command/prereqs keys are absent
    // (TypeScript refuses to read them).
    if (!result.install.skipped) return
    // `JSON.stringify` confirms the runtime shape: the
    // install object is just `{ "skipped": true }`.
    expect(JSON.stringify(result.install)).toBe('{"skipped":true}')
  })

  it("the full result round-trips through JSON.stringify without loss", () => {
    const result: CreateDryRunResult = buildDryRunResult({
      sha,
      destination,
      packageName,
      entries,
      install: true,
      prereqs: { corepack: false, npm: true, pnpm: false },
      strategy: "npm-exec",
      installCommand: {
        bin: "npm",
        args: ["exec", "--yes", "--", "pnpm@11.0.0", "install"],
      },
      pnpmVersion: "11.0.0",
    })
    const round = JSON.parse(JSON.stringify(result)) as CreateDryRunResult
    expect(round).toEqual(result)
  })

  it("throws internal when install is true but prereq metadata is missing", () => {
    expect(() =>
      buildDryRunResult({
        sha,
        destination,
        packageName,
        entries,
        install: true,
        prereqs: undefined,
        strategy: undefined,
        installCommand: undefined,
        pnpmVersion: undefined,
      })
    ).toThrow(/dry-run with install requested but prereq metadata is missing/)
  })
})
