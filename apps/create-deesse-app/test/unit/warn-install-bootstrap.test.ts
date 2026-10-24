import { describe, expect, it } from "vitest"

import { warnInstallBootstrap } from "../../src/install/warn-install-bootstrap.js"

describe("warnInstallBootstrap", () => {
  it("writes the corepack line for the corepack strategy", () => {
    const captured: string[] = []
    warnInstallBootstrap("corepack", "create", (s) => captured.push(s))
    expect(captured).toHaveLength(1)
    expect(captured[0]).toContain("installing dependencies via corepack")
    expect(captured[0]).toContain("packageManager field")
  })

  it("writes the npm-exec line for the npm-exec strategy", () => {
    const captured: string[] = []
    warnInstallBootstrap("npm-exec", "create", (s) => captured.push(s))
    expect(captured).toHaveLength(1)
    expect(captured[0]).toContain("corepack not found")
    expect(captured[0]).toContain("npm")
    // The wording says "may be downloaded" because pnpm@version
    // may already be in npm's cache.
    expect(captured[0]).toContain("may be downloaded")
  })

  it("writes the pnpm-direct line for the pnpm-direct strategy", () => {
    const captured: string[] = []
    warnInstallBootstrap("pnpm-direct", "create", (s) => captured.push(s))
    expect(captured).toHaveLength(1)
    expect(captured[0]).toContain("corepack and npm not found")
    // The wording does not claim the version matches the project.
    expect(captured[0]).toContain("not guaranteed to match the project")
  })

  it("contains the `create-deesse-app:` marker in every line", () => {
    // The prefix is dim-styled when the terminal supports
    // color, so the line may begin with ANSI escape codes
    // (ESC[2m ... ESC[22m). The marker is plain text; we
    // look for it anywhere in the line, which is robust to
    // color escape codes and the suffix.
    const captured: string[] = []
    warnInstallBootstrap("corepack", "create", (s) => captured.push(s))
    warnInstallBootstrap("npm-exec", "create", (s) => captured.push(s))
    warnInstallBootstrap("pnpm-direct", "create", (s) => captured.push(s))
    expect(captured.every((s) => s.includes("create-deesse-app:"))).toBe(true)
  })

  it("ends every line with a single newline", () => {
    const captured: string[] = []
    warnInstallBootstrap("corepack", "create", (s) => captured.push(s))
    warnInstallBootstrap("npm-exec", "create", (s) => captured.push(s))
    warnInstallBootstrap("pnpm-direct", "create", (s) => captured.push(s))
    expect(captured.every((s) => s.endsWith("\n"))).toBe(true)
    expect(captured.every((s) => s.endsWith("\n\n"))).toBe(false)
  })

  it("calls the writer exactly once per call", () => {
    const captured: string[] = []
    warnInstallBootstrap("corepack", "create", (s) => captured.push(s))
    expect(captured).toHaveLength(1)
  })

  it("in dry-run mode, the corepack line says 'would use' and never 'installing dependencies'", () => {
    // The dry-run line must not claim an install is starting
    // — the user is reading a plan, not watching pnpm run.
    const captured: string[] = []
    warnInstallBootstrap("corepack", "dry-run", (s) => captured.push(s))
    expect(captured[0]).toContain("would use corepack")
    expect(captured[0]).not.toContain("installing dependencies")
    expect(captured[0]).toContain("dry-run")
  })

  it("in dry-run mode, the npm-exec line says 'would fall back to npm'", () => {
    const captured: string[] = []
    warnInstallBootstrap("npm-exec", "dry-run", (s) => captured.push(s))
    expect(captured[0]).toContain("dry-run")
    expect(captured[0]).toContain("would fall back to npm")
    expect(captured[0]).not.toContain("installing dependencies")
  })

  it("in dry-run mode, the pnpm-direct line says 'would use pnpm from PATH'", () => {
    const captured: string[] = []
    warnInstallBootstrap("pnpm-direct", "dry-run", (s) => captured.push(s))
    expect(captured[0]).toContain("dry-run")
    expect(captured[0]).toContain("would use pnpm from PATH")
    expect(captured[0]).not.toContain("installing dependencies")
  })
})
