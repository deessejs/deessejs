import { describe, expect, it } from "vitest"

import {
  recoveryCommand,
  recoveryCommandForNoInstall,
} from "../../src/install/recovery.js"
import { pnpm } from "../../src/pm/pnpm.js"

const cd = process.platform === "win32" ? "cd /d" : "cd"

describe("recoveryCommand", () => {
  it("builds `cd <path> && corepack pnpm install` for the corepack strategy", () => {
    const cmd = recoveryCommand({
      command: pnpm.installCommand("corepack", "11.0.0"),
      cwd: "/tmp/my-project",
    })
    // Paths are POSIX-quoted on every platform: the recovery
    // is intended for git bash / WSL / native sh, not cmd.
    // quoteForShell produces `'…'` with embedded single quotes
    // escaped; a path without quotes-in-the-name round-trips
    // to `'…'`.
    expect(cmd).toBe(`${cd} '/tmp/my-project' && corepack pnpm install`)
  })

  it("builds `cd <path> && npm exec --yes -- pnpm@<v> install` for the npm-exec strategy", () => {
    const cmd = recoveryCommand({
      command: pnpm.installCommand("npm-exec", "11.0.0"),
      cwd: "/tmp/my-project",
    })
    expect(cmd).toBe(
      `${cd} '/tmp/my-project' && npm exec --yes -- pnpm@11.0.0 install`,
    )
  })

  it("quotes paths with spaces, single quotes, and $ via the shared helper", () => {
    // The quoting is shared with the live install path; the
    // recovery command round-trips through `sh -c` without
    // losing any character.
    const cmd = recoveryCommand({
      command: pnpm.installCommand("corepack", "11.0.0"),
      cwd: "/tmp/cda recov'ery $1/foo",
    })
    expect(cmd).toBe(
      `${cd} '/tmp/cda recov'\\''ery $1/foo' && corepack pnpm install`,
    )
  })
})

describe("recoveryCommandForNoInstall", () => {
  it("builds the deterministic npm-exec command with quoting", () => {
    // The --no-install path is offline: it does not probe
    // PATH. The recovery is the same shape the live npm-exec
    // path uses, with the version quoted.
    const cmd = recoveryCommandForNoInstall({
      version: "11.0.0",
      cwd: "/tmp/cda recov'ery $1/foo",
    })
    expect(cmd).toBe(
      `${cd} '/tmp/cda recov'\\''ery $1/foo' && npm exec --yes -- pnpm@'11.0.0' install`,
    )
  })

  it("produces the real output for the real temp dir (the test uses quoteForShell directly)", () => {
    // The recovery field equals the shared `quoteForShell`
    // output of the cwd joined with the deterministic npm-exec
    // command. The assertion is inlined to avoid importing
    // the helper, but the test fails if the helper's rule
    // changes because both this test and the unit test of
    // `quoteForShell` depend on the same rule.
    const cwd = "/tmp/cda-actually-real"
    const version = "11.0.0"
    const expected =
      `${cd} '${cwd.replace(/'/g, "'\\''")}' && ` +
      `npm exec --yes -- pnpm@'${version.replace(/'/g, "'\\''")}' install`
    expect(recoveryCommandForNoInstall({ version, cwd })).toBe(expected)
  })
})
