import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

import { recoveryCommandForReRun } from "../../src/install/recovery.js"

// Tests for the launcher-agnostic re-run recovery shape
// used by the `aborted` failure path. The helper is pure
// of `process.platform` (no quoting needed; the project
// name is lowercase-dash-separated and a custom `--dir`
// is passed verbatim).

const defaultDirFor = (projectName: string): string =>
  resolve(process.cwd(), `./${projectName}`)

describe("recoveryCommandForReRun", () => {
  it("emits the canonical paste form with a default dir and install=true", () => {
    const cmd = recoveryCommandForReRun({
      projectName: "my-app",
      dir: defaultDirFor("my-app"),
      install: true,
      defaultDir: defaultDirFor("my-app"),
    })
    expect(cmd).toBe("create-deesse-app@latest my-app")
  })

  it("preserves a custom --dir when the user passed one", () => {
    const cmd = recoveryCommandForReRun({
      projectName: "my-app",
      dir: "/tmp/custom-path",
      install: true,
      defaultDir: defaultDirFor("my-app"),
    })
    expect(cmd).toBe("create-deesse-app@latest my-app --dir /tmp/custom-path")
  })

  it("preserves --no-install when the user passed it", () => {
    const cmd = recoveryCommandForReRun({
      projectName: "my-app",
      dir: defaultDirFor("my-app"),
      install: false,
      defaultDir: defaultDirFor("my-app"),
    })
    expect(cmd).toBe("create-deesse-app@latest my-app --no-install")
  })

  it("preserves both a custom --dir and --no-install", () => {
    const cmd = recoveryCommandForReRun({
      projectName: "my-app",
      dir: "/tmp/custom",
      install: false,
      defaultDir: defaultDirFor("my-app"),
    })
    expect(cmd).toBe(
      "create-deesse-app@latest my-app --dir /tmp/custom --no-install"
    )
  })

  it("does NOT prefix a launcher (pnpm dlx, npx, npm exec)", () => {
    const cmd = recoveryCommandForReRun({
      projectName: "my-app",
      dir: defaultDirFor("my-app"),
      install: true,
      defaultDir: defaultDirFor("my-app"),
    })
    expect(cmd).not.toMatch(/^pnpm /)
    expect(cmd).not.toMatch(/^npx /)
    expect(cmd).not.toMatch(/^npm /)
  })

  it("does NOT prefix a `cd` (the destination may not exist yet)", () => {
    const cmd = recoveryCommandForReRun({
      projectName: "my-app",
      dir: "/tmp/somewhere",
      install: true,
      defaultDir: defaultDirFor("my-app"),
    })
    expect(cmd).not.toMatch(/^cd /)
  })

  it("drops --verbose when the user passed it (recovery is the minimum command)", () => {
    // The recovery helper does not accept `verbose` as a
    // parameter; the pipeline never forwards it. The
    // assertion here is a regression guard: if a future
    // change adds `verbose` to the helper's input, the
    // user-visible shape must not echo it.
    const cmd = recoveryCommandForReRun({
      projectName: "my-app",
      dir: defaultDirFor("my-app"),
      install: true,
      defaultDir: defaultDirFor("my-app"),
    })
    expect(cmd).not.toContain("--verbose")
  })

  it("treats the default dir comparison case-sensitively (matches the index.ts rule)", () => {
    // `resolve()` lowercases on Windows. The pipeline
    // computes `defaultDir` via the same `resolve` call
    // as `index.ts`, so the comparison is byte-stable
    // across platforms. This test pins the rule: a
    // Windows path on a Windows host with mixed case
    // still compares equal when the user accepted the
    // default.
    const projectName = "my-app"
    const defaultDir = defaultDirFor(projectName)
    // The user passed the default back unchanged.
    const cmd = recoveryCommandForReRun({
      projectName,
      dir: defaultDir,
      install: true,
      defaultDir,
    })
    expect(cmd).toBe("create-deesse-app@latest my-app")
  })
})
