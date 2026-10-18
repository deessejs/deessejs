import { describe, expect, it } from "vitest"

import {
  recoveryCommand,
  recoveryCommandForNoInstall,
} from "../../src/install/recovery.js"
import { pnpm } from "../../src/pm/pnpm.js"

const cd = "cd"
const quote = quoteForShellInTest

// Mirror the production `quoteForShell` rule inline so the
// assertions do not import the helper. The helper is
// unit-tested separately in `quote.test.ts`. The recovery
// command uses POSIX quoting on every platform; the README
// documents the rationale (cmd quoting has historical
// quirks; git bash or WSL is the supported path on Windows).
function quoteForShellInTest(s: string): string {
  if (s === "") return "''"
  return `'${s.replace(/'/g, "'\\''")}'`
}

describe("recoveryCommand", () => {
  it("quotes every component of the install command", () => {
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
})

describe("recoveryCommandForNoInstall", () => {
  it("builds the deterministic npm-exec command with quoting", () => {
    const cmd = recoveryCommandForNoInstall({
      version: "11.0.0",
      cwd: "/tmp/cda recov'ery $1/foo",
    })
    expect(cmd).toBe(
      `${cd} ${quote("/tmp/cda recov'ery $1/foo")} && npm exec --yes -- pnpm@${quote("11.0.0")} install`,
    )
  })

  it("quotes a version that itself contains shell metacharacters", () => {
    const cmd = recoveryCommandForNoInstall({
      version: "11.0.0$(touch /tmp/x)",
      cwd: "/tmp/my-project",
    })
    const version = "11.0.0$(touch /tmp/x)"
    const quoted = quote(version)
    expect(cmd).toBe(
      `${cd} ${quote("/tmp/my-project")} && npm exec --yes -- pnpm@${quoted} install`,
    )
  })
})
