import { describe, expect, it } from "vitest"

import { recoveryCommand } from "../../src/install/recovery.js"
import { pnpm } from "../../src/pm/pnpm.js"

describe("recoveryCommand", () => {
  it("builds `cd <path> && pnpm install` for absolute paths", () => {
    const cmd = recoveryCommand({ manager: pnpm, cwd: "/tmp/my-project" })
    if (process.platform === "win32") {
      expect(cmd).toBe("cd /d /tmp/my-project && pnpm install")
    } else {
      expect(cmd).toBe("cd /tmp/my-project && pnpm install")
    }
  })

  it("quotes relative paths with spaces", () => {
    const cmd = recoveryCommand({ manager: pnpm, cwd: "my project" })
    if (process.platform === "win32") {
      expect(cmd).toBe('cd /d "my project" && pnpm install')
    } else {
      expect(cmd).toBe('cd "my project" && pnpm install')
    }
  })
})