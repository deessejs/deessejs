import { execFile } from "node:child_process"
import { createRequire } from "node:module"
import { promisify } from "node:util"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const execFileAsync = promisify(execFile)
const cliPath = resolve(import.meta.dirname, "../../dist/index.js")
const packageJson = createRequire(import.meta.url)("../../package.json") as { version: string }

describe("CLI version option", () => {
  it.each(["-v", "--version"])("prints the package version for %s", async (flag) => {
    const { stdout, stderr } = await execFileAsync(process.execPath, [cliPath, flag])

    expect(stdout.trim()).toBe(packageJson.version)
    expect(stderr).toBe("")
  })

  it("shows both version option forms in help", async () => {
    const { stdout } = await execFileAsync(process.execPath, [cliPath, "--help"])

    expect(stdout).toContain("-v, --version")
  })
})
