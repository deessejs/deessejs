import { afterEach, describe, expect, it, vi } from "vitest"

import {
  recoveryCommand,
  recoveryCommandForNoInstall,
} from "../../src/install/recovery.js"
import { pnpm } from "../../src/pm/pnpm.js"

// Mirror the production `quoteForShell` rule inline so the
// assertions do not import the helper. The helper is
// unit-tested separately in `quote.test.ts`. The recovery
// command uses POSIX quoting on non-Windows hosts.
function quoteForShellInTest(s: string): string {
  if (s === "") return "''"
  return `'${s.replace(/'/g, "'\\''")}'`
}

// Mirror the production `quoteForCmd` rule for the same
// reason. The rule set is the one the round-trip in
// `quote.test.ts` exercises: literal double quotes are
// escaped as `\"`; `^` becomes `^^`; `!` becomes `^^!`; `%`
// becomes `%%`; `& | < > ( )` are NOT escaped because they
// are literal inside double quotes on modern `cmd`.
function quoteForCmdInTest(s: string): string {
  if (s === "") return '""'
  const escaped = s
    .replace(/"/g, '\\"')
    .replace(/\^/g, "^^")
    .replace(/!/g, "^^!")
    .replace(/%/g, "%%")
  return `"${escaped}"`
}

// `process.platform` is captured at module load time inside
// `recovery.ts`. We stub it per test so the same test file
// exercises both branches without spawning a child Node.
const originalPlatform = process.platform
const setPlatform = (p: NodeJS.Platform): void => {
  Object.defineProperty(process, "platform", {
    value: p,
    configurable: true,
  })
}
afterEach(() => {
  setPlatform(originalPlatform)
  vi.restoreAllMocks()
})

describe("recoveryCommand (POSIX host)", () => {
  it("quotes every component of the install command", () => {
    setPlatform("linux")
    const cmd = recoveryCommand({
      command: pnpm.installCommand("corepack", "11.0.0"),
      cwd: "/tmp/my-project",
    })
    const expectedParts = [
      quoteForShellInTest("/tmp/my-project"),
      "&&",
      quoteForShellInTest("corepack"),
      quoteForShellInTest("pnpm"),
      quoteForShellInTest("install"),
    ]
    expect(cmd).toBe(`cd ${expectedParts.join(" ")}`)
  })

  it("builds `cd <path> && npm exec --yes -- pnpm@<v> install` for the npm-exec strategy", () => {
    setPlatform("linux")
    const cmd = recoveryCommand({
      command: pnpm.installCommand("npm-exec", "11.0.0"),
      cwd: "/tmp/my-project",
    })
    expect(cmd).toBe(
      `cd ${quoteForShellInTest("/tmp/my-project")} && ${quoteForShellInTest("npm")} ${quoteForShellInTest("exec")} ${quoteForShellInTest("--yes")} ${quoteForShellInTest("--")} ${quoteForShellInTest("pnpm@11.0.0")} ${quoteForShellInTest("install")}`,
    )
  })

  it("quotes paths with spaces, single quotes, and $ via the shared helper", () => {
    setPlatform("darwin")
    const cmd = recoveryCommand({
      command: pnpm.installCommand("corepack", "11.0.0"),
      cwd: "/tmp/cda recov'ery $1/foo",
    })
    expect(cmd).toBe(
      `cd ${quoteForShellInTest("/tmp/cda recov'ery $1/foo")} && ${quoteForShellInTest("corepack")} ${quoteForShellInTest("pnpm")} ${quoteForShellInTest("install")}`,
    )
  })
})

describe("recoveryCommand (Windows host)", () => {
  it("emits the `cd /d \"<path>\" && <cmd>...` cmd form with `quoteForCmd`", () => {
    setPlatform("win32")
    const cmd = recoveryCommand({
      command: pnpm.installCommand("corepack", "11.0.0"),
      cwd: "C:\\Users\\foo\\my-project",
    })
    const expectedParts = [
      quoteForCmdInTest("C:\\Users\\foo\\my-project"),
      "&&",
      quoteForCmdInTest("corepack"),
      quoteForCmdInTest("pnpm"),
      quoteForCmdInTest("install"),
    ]
    expect(cmd).toBe(`cd /d ${expectedParts.join(" ")}`)
  })

  it("emits the cmd form for the npm-exec strategy", () => {
    setPlatform("win32")
    const cmd = recoveryCommand({
      command: pnpm.installCommand("npm-exec", "11.0.0"),
      cwd: "C:\\Users\\foo\\my-project",
    })
    expect(cmd).toBe(
      `cd /d ${quoteForCmdInTest("C:\\Users\\foo\\my-project")} && ${quoteForCmdInTest("npm")} ${quoteForCmdInTest("exec")} ${quoteForCmdInTest("--yes")} ${quoteForCmdInTest("--")} ${quoteForCmdInTest("pnpm@11.0.0")} ${quoteForCmdInTest("install")}`,
    )
  })

  it("escapes cmd metacharacters (^, !, %) but leaves & | < > ( ) literal", () => {
    setPlatform("win32")
    // The Windows path 100% and the cmd-special `!` in the
    // path or version must be escaped, while `&` inside a
    // quoted argument must NOT be escaped.
    const cmd = recoveryCommand({
      command: pnpm.installCommand("corepack", "11.0.0"),
      cwd: "C:\\Users\\100%done & forever^oops",
    })
    expect(cmd).toBe(
      `cd /d ${quoteForCmdInTest("C:\\Users\\100%done & forever^oops")} && ${quoteForCmdInTest("corepack")} ${quoteForCmdInTest("pnpm")} ${quoteForCmdInTest("install")}`,
    )
  })
})

describe("recoveryCommandForNoInstall (POSIX host)", () => {
  it("builds the deterministic npm-exec command with quoting", () => {
    setPlatform("linux")
    const cmd = recoveryCommandForNoInstall({
      version: "11.0.0",
      cwd: "/tmp/cda recov'ery $1/foo",
    })
    expect(cmd).toBe(
      `cd ${quoteForShellInTest("/tmp/cda recov'ery $1/foo")} && npm exec --yes -- pnpm@${quoteForShellInTest("11.0.0")} install`,
    )
  })

  it("quotes a version that itself contains shell metacharacters", () => {
    setPlatform("linux")
    const cmd = recoveryCommandForNoInstall({
      version: "11.0.0$(touch /tmp/x)",
      cwd: "/tmp/my-project",
    })
    const version = "11.0.0$(touch /tmp/x)"
    const quoted = quoteForShellInTest(version)
    expect(cmd).toBe(
      `cd ${quoteForShellInTest("/tmp/my-project")} && npm exec --yes -- pnpm@${quoted} install`,
    )
  })
})

describe("recoveryCommandForNoInstall (Windows host)", () => {
  it("emits the `cd /d \"<path>\" && npm exec --yes -- pnpm@<v> install` form", () => {
    setPlatform("win32")
    const cmd = recoveryCommandForNoInstall({
      version: "11.0.0",
      cwd: "C:\\Users\\foo\\my-project",
    })
    expect(cmd).toBe(
      `cd /d ${quoteForCmdInTest("C:\\Users\\foo\\my-project")} && npm exec --yes -- pnpm@${quoteForCmdInTest("11.0.0")} install`,
    )
  })

  it("escapes a version containing cmd metacharacters", () => {
    setPlatform("win32")
    // A version with `!` and `%` round-trips through cmd
    // without surprises.
    const cmd = recoveryCommandForNoInstall({
      version: "11.0.0!rc%1",
      cwd: "C:\\Users\\foo",
    })
    expect(cmd).toBe(
      `cd /d ${quoteForCmdInTest("C:\\Users\\foo")} && npm exec --yes -- pnpm@${quoteForCmdInTest("11.0.0!rc%1")} install`,
    )
  })
})
