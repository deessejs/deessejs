import { describe, expect, it } from "vitest"

import { runCommand } from "../support/process.js"

import { join } from "node:path"

/**
 * Native CLI smoke for Windows / macOS. These tests run the
 * bundled CLI directly and do NOT need network access. They
 * cover the parts of the CLI contract that exercise only the
 * argument parser and the help/version/usage path:
 *
 *  - --version prints a non-empty version
 *  - --help prints a non-empty usage
 *  - the npm-invocation guard fires (no FS work, no network)
 *  - an unknown flag is rejected with a non-zero exit
 *
 * Linux CI exercises the full consumer journey in
 * test/e2e/{packed-archive,verdaccio-roundtrip,
 * application-generation}.test.ts. macOS and Windows CI runs
 * this file plus native-generation.test.ts to prove the CLI
 * itself behaves the same on every supported platform.
 *
 * "no network" here is strict: no GitHub call, no template
 * download, no DNS. Anything that does need network lives in
 * native-generation.test.ts and is named as such.
 */
describe("create-deesse-app: native CLI (no network)", () => {
  const cliPath = join(import.meta.dirname, "..", "..", "..", "dist", "index.js")

  it("--version prints a non-empty version", async () => {
    const result = await runCommand("node", [cliPath, "--version"], {
      timeoutMs: 30_000,
    })
    expect(result.exitCode, result.stderr).toBe(0)
    expect(result.stdout.trim().length).toBeGreaterThan(0)
  })

  it("--help prints a non-empty usage", async () => {
    const result = await runCommand("node", [cliPath, "--help"], {
      timeoutMs: 30_000,
    })
    expect(result.exitCode, result.stderr).toBe(0)
    expect(result.stdout.trim().length).toBeGreaterThan(0)
  })

  it("rejects an unknown flag and exits non-zero", async () => {
    const result = await runCommand(
      "node",
      [cliPath, "smoke-project", "--this-does-not-exist"],
      { timeoutMs: 30_000 },
    )
    expect(result.exitCode).toBe(1)
  })

  it("rejects an npm invocation and exits non-zero", async () => {
    // The npm-invocation guard fires before any FS work, so the
    // destination does not need to exist and no network call
    // is made. We only inject what the test needs.
    const env = {
      PATH: process.env.PATH,
      // Marker: the CLI should reject this exact prefix.
      npm_config_user_agent: "npm/10.4.0",
    } as NodeJS.ProcessEnv
    const result = await runCommand(
      "node",
      [cliPath, "smoke-project", "--no-install", "--dir", "/tmp/cda-smoke-npm-test"],
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
  })
})
