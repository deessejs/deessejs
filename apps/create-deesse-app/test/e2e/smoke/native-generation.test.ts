import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { runCommand } from "../support/process.js"

/**
 * Native generation smoke for Windows / macOS. Unlike
 * native-cli.test.ts, every test in this file requires
 * network access: the CLI's --no-install path uses
 * \`git ls-remote\` against github.com/deessejs/saas-template
 * to find the latest commit, then downloads the tarball.
 *
 * CI Windows and macOS runners run this in addition to the
 * pure-CLI tests. If you are running this in a sandboxed
 * environment without github.com access, the tests will
 * fail with a network/clone error — that is expected and
 * means the network dependency, not a CLI regression.
 *
 * For deterministic, network-free generation testing, see
 * test/e2e/{packed-archive,verdaccio-roundtrip,
 * application-generation}.test.ts, which run only on Linux
 * and exercise the full consumer path against a pinned
 * archive.
 */
describe("create-deesse-app: native generation (network-dependent)", () => {
  const cliPath = join(import.meta.dirname, "..", "..", "..", "dist", "index.js")

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
})
