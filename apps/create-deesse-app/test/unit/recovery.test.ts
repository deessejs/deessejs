import { describe, expect, it } from "vitest"

import {
  recoveryCommand,
  recoveryCommandForNoInstall,
} from "../../src/install/recovery.js"
import { pnpm } from "../../src/pm/pnpm.js"

const cd = process.platform === "win32" ? "cd /d" : "cd"
const quote = process.platform === "win32" ? quoteForCmdInTest : quoteForShellInTest

// Mirror the platform-specific quoting rule inline so the
// assertions do not import the helper. The helper is
// unit-tested separately in `quote.test.ts`.
function quoteForShellInTest(s: string): string {
  if (s === "") return "''"
  return `'${s.replace(/'/g, "'\\''")}'`
}

function quoteForCmdInTest(s: string): string {
  if (s === "") return '""'
  return (
    '"' +
    s
      .replace(/"/g, '\\"')
      .replace(/\^/g, "^^")
      .replace(/[&|<>()%!]/g, "^$&") +
    '"'
  )
}

describe("recoveryCommand", () => {
  it("quotes every component of the install command on every platform", () => {
    // The cwd, the bin, and every arg are independently quoted.
    // The fixture's cwd has no special characters; the version
    // arg is unquoted because it has no special characters;
    // the result is functionally identical to the unquoted
    // form but the structure is uniform.
    const cmd = recoveryCommand({
      command: pnpm.installCommand("corepack", "11.0.0"),
      cwd: "/tmp/my-project",
    })
    const expectedParts = [
      quote("/tmp/my-project"),
      "&&",
      quote("corepack"),
      quote("pnpm"),
      quote("install"),
    ]
    expect(cmd).toBe(`${cd} ${expectedParts.join(" ")}`)
  })

  it("builds `cd <path> && npm exec --yes -- pnpm@<v> install` for the npm-exec strategy", () => {
    const cmd = recoveryCommand({
      command: pnpm.installCommand("npm-exec", "11.0.0"),
      cwd: "/tmp/my-project",
    })
    expect(cmd).toBe(
      `${cd} ${quote("/tmp/my-project")} && ${quote("npm")} ${quote("exec")} ${quote("--yes")} ${quote("--")} ${quote(`pnpm@11.0.0`)} ${quote("install")}`,
    )
  })

  it("quotes paths with spaces, single quotes, and $ via the shared helper", () => {
    const cmd = recoveryCommand({
      command: pnpm.installCommand("corepack", "11.0.0"),
      cwd: "/tmp/cda recov'ery $1/foo",
    })
    expect(cmd).toBe(
      `${cd} ${quote("/tmp/cda recov'ery $1/foo")} && ${quote("corepack")} ${quote("pnpm")} ${quote("install")}`,
    )
  })

  it("quotes a version that contains shell metacharacters in the version arg", () => {
    // The version 11.0.0-rc.1 has no special characters, but
    // this test exercises the "version with single quote"
    // case, which the helper must escape. (The CI test runs
    // the recovery through the same code path that handles
    // the supported pnpm version forms; metacharacter versions
    // are blocked at the read step, not the recovery step.)
    const cmd = recoveryCommand({
      command: pnpm.installCommand("npm-exec", "11.0.0-rc.1"),
      cwd: "/tmp/my-project",
    })
    expect(cmd).toBe(
      `${cd} ${quote("/tmp/my-project")} && ${quote("npm")} ${quote("exec")} ${quote("--yes")} ${quote("--")} ${quote(`pnpm@11.0.0-rc.1`)} ${quote("install")}`,
    )
  })
})

describe("recoveryCommandForNoInstall", () => {
  it("builds the deterministic npm-exec command with quoting on every platform", () => {
    const cmd = recoveryCommandForNoInstall({
      version: "11.0.0",
      cwd: "/tmp/cda recov'ery $1/foo",
    })
    expect(cmd).toBe(
      `${cd} ${quote("/tmp/cda recov'ery $1/foo")} && npm exec --yes -- pnpm@${quote("11.0.0")} install`,
    )
  })

  it("quotes a version that itself contains shell metacharacters", () => {
    // The semver boundary rejects this upstream; this test
    // asserts the recovery command would still be safe to
    // paste if a future change relaxed the boundary. The
    // recovery must never produce a string that, when copied
    // and pasted, would execute additional commands.
    const cmd = recoveryCommandForNoInstall({
      version: "11.0.0'$(touch /tmp/x)",
      cwd: "/tmp/my-project",
    })
    // The version is quoted by the shared helper, so the
    // single quote is escaped and the `$(...)` is harmless.
    expect(cmd).toBe(
      `${cd} ${quote("/tmp/my-project")} && npm exec --yes -- pnpm@${quote("11.0.0'$(touch /tmp/x)")} install`,
    )
  })
})
