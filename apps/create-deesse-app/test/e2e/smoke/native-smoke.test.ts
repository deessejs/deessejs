import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { runCommand } from "../support/process.js"

/**
 * Native smoke for Windows / macOS. The full e2e journey (Verdaccio,
 * PostgreSQL, generated-app Playwright) requires Docker and runs on
 * Linux only. This file covers the parts of the contract that do
 * not need a real consumer environment:
 *
 *  - the bundled CLI exits 0 on --version and on a successful
 *    generation with --no-install
 *  - the destination is rejected when it already exists
 *  - the npm-invocation guard fires
 *  - the JSON-on-stdout contract holds on every platform
 *
 * Linux CI runs the full journey in packed-archive.test.ts (or
 * verdaccio.test.ts once commit 2 lands). This file is what the
 * Windows and macOS jobs run to prove the CLI itself behaves the
 * same way the brief asks for: "Add native macOS or Windows jobs
 * only for operating-system support promised by the CLI contract."
 */
describe("create-deesse-app: native smoke (Windows / macOS)", () => {
  const cliPath = join(import.meta.dirname, "..", "..", "..", "dist", "index.js")

  it("--version prints a non-empty version", async () => {
    const result = await runCommand("node", [cliPath, "--version"], {
      timeoutMs: 30_000,
    })
    expect(result.exitCode, result.stderr).toBe(0)
    expect(result.stdout.trim().length).toBeGreaterThan(0)
  })

  it("generates a project with --no-install and prints one JSON object on stdout", async () => {
    // The CLI rejects an existing destination. We allocate a fresh
    // tmpdir (the parent exists, the destination inside it does not)
    // and pass that path to --dir.
    const work = mkdtempSync(join(tmpdir(), "cda-smoke-parent-"))
    const dest = join(work, "smoke-project")
    try {
      const result = await runCommand(
        "node",
        [cliPath, "smoke-project", "--no-install", "--dir", dest],
        { timeoutMs: 60_000 },
      )
      expect(result.exitCode, result.stderr).toBe(0)
      const trimmed = result.stdout.trim()
      expect(trimmed.startsWith("{")).toBe(true)
      expect(trimmed.endsWith("}")).toBe(true)
      const parsed = JSON.parse(trimmed) as {
        ok: boolean
        installed: boolean
      }
      expect(parsed.ok).toBe(true)
      expect(parsed.installed).toBe(false)
    } finally {
      rmSync(work, { recursive: true, force: true })
    }
  })

  it("rejects an existing destination and exits non-zero", async () => {
    const work = mkdtempSync(join(tmpdir(), "cda-smoke-parent-"))
    const dest = join(work, "smoke-project")
    try {
      const first = await runCommand(
        "node",
        [cliPath, "smoke-project", "--no-install", "--dir", dest],
        { timeoutMs: 60_000 },
      )
      expect(first.exitCode, first.stderr).toBe(0)
      // Re-run with the same destination; should fail.
      const second = await runCommand(
        "node",
        [cliPath, "smoke-project", "--no-install", "--dir", dest],
        { timeoutMs: 60_000 },
      )
      expect(second.exitCode).toBe(1)
      const parsed = JSON.parse(second.stdout.trim()) as {
        ok: boolean
        error: { code: string }
      }
      expect(parsed.ok).toBe(false)
      expect(parsed.error.code).toBe("destination_exists")
    } finally {
      rmSync(work, { recursive: true, force: true })
    }
  })

  it("rejects an npm invocation and exits non-zero", async () => {
    // The npm-invocation guard fires before any FS work, so the
    // destination does not need to exist. Use a fresh subdirectory
    // of a brand-new tmpdir to make the test fully independent of
    // any other test in this file or in the workspace.
    const work = mkdtempSync(join(tmpdir(), "cda-smoke-npm-"))
    const dest = join(work, "smoke-project")
    try {
      const env = {
        // Start from a clean env so the harness's own npm/CI env
        // does not leak in. We only inject what the test needs.
        PATH: process.env.PATH,
        // Marker: the CLI should reject this exact prefix.
        npm_config_user_agent: "npm/10.4.0",
      } as NodeJS.ProcessEnv
      const result = await runCommand(
        "node",
        [cliPath, "smoke-project", "--no-install", "--dir", dest],
        {
          timeoutMs: 30_000,
          env,
        },
      )
      expect(result.exitCode).toBe(1)
      const parsed = JSON.parse(result.stdout.trim()) as {
        ok: boolean
        error: { code: string }
      }
      expect(parsed.ok).toBe(false)
      expect(parsed.error.code).toBe("unsupported_manager")
    } finally {
      rmSync(work, { recursive: true, force: true })
    }
  })
})
