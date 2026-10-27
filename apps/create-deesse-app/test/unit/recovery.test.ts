import { afterEach, describe, expect, it } from "vitest"

import {
  recoveryCommand,
  recoveryCommandForNoInstall,
} from "../../src/install/recovery.js"
import { pnpm } from "../../src/pm/pnpm.js"

const originalPlatform = process.platform
const setPlatform = (platform: NodeJS.Platform): void => {
  Object.defineProperty(process, "platform", {
    value: platform,
    configurable: true,
  })
}

afterEach(() => {
  setPlatform(originalPlatform)
})

describe("recoveryCommand (POSIX host)", () => {
  it("quotes the directory and every install argument", () => {
    setPlatform("linux")
    const command = recoveryCommand({
      command: pnpm.installCommand("corepack", "11.0.0"),
      cwd: "/tmp/my project",
    })

    expect(command).toBe("cd '/tmp/my project' && 'corepack' 'pnpm' 'install'")
  })

  it("escapes embedded apostrophes and shell metacharacters", () => {
    setPlatform("darwin")
    const command = recoveryCommand({
      command: pnpm.installCommand("corepack", "11.0.0"),
      cwd: "/tmp/dave's $folder",
    })

    expect(command).toBe(
      "cd '/tmp/dave'\\''s $folder' && 'corepack' 'pnpm' 'install'"
    )
  })
})

describe("recoveryCommand (Windows PowerShell host)", () => {
  it("uses PowerShell syntax and quotes every command argument", () => {
    setPlatform("win32")
    const command = recoveryCommand({
      command: pnpm.installCommand("corepack", "11.0.0"),
      cwd: "C:\\Users\\foo\\my-project",
    })

    expect(command).toBe(
      "Set-Location -LiteralPath 'C:\\Users\\foo\\my-project'; & 'corepack' 'pnpm' 'install'"
    )
  })

  it("preserves apostrophes, backslashes, and shell metacharacters in paths", () => {
    setPlatform("win32")
    const command = recoveryCommand({
      command: pnpm.installCommand("corepack", "11.0.0"),
      cwd: "C:\\Users\\Dave's folder\\100%done & forever^oops",
    })

    expect(command).toBe(
      "Set-Location -LiteralPath 'C:\\Users\\Dave''s folder\\100%done & forever^oops'; & 'corepack' 'pnpm' 'install'"
    )
  })

  it("quotes the package manager version as one argument", () => {
    setPlatform("win32")
    const command = recoveryCommandForNoInstall({
      version: "11.0.0",
      cwd: "C:\\Users\\foo",
    })

    expect(command).toBe(
      "Set-Location -LiteralPath 'C:\\Users\\foo'; & 'npm' 'exec' '--yes' '--' 'pnpm@11.0.0' 'install'"
    )
  })
})

describe("recoveryCommandForNoInstall (POSIX host)", () => {
  it("quotes the package manager version as one argument", () => {
    setPlatform("linux")
    const command = recoveryCommandForNoInstall({
      version: "11.0.0",
      cwd: "/tmp/my project",
    })

    expect(command).toBe(
      "cd '/tmp/my project' && 'npm' 'exec' '--yes' '--' 'pnpm@11.0.0' 'install'"
    )
  })
})
