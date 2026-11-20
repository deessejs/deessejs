import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const execFileAsync = promisify(execFile)
const cliPath = resolve(import.meta.dirname, "../../dist/index.js")

const commandEntries = (help: string, names: string[]): string[] => {
  const commandsSection = help.split("Commands:")[1]?.split("\n\n")[0]
  if (!commandsSection) throw new Error("Commands section missing from help")

  return commandsSection.split("\n").flatMap((line) => {
    const entry = line.trim()
    const name = names.find((candidate) => entry.startsWith(candidate))
    return name ? [name] : []
  })
}

describe("CLI help command ordering", () => {
  it("sorts root commands alphabetically and shows canonical names", async () => {
    const { stdout } = await execFileAsync(process.execPath, [cliPath, "help"])

    const expected = [
      "add",
      "auth",
      "block",
      "cache",
      "help",
      "organization",
      "template",
      "update",
    ]
    expect(commandEntries(stdout, expected)).toEqual(expected)
    expect(stdout).toContain("template")
    expect(commandEntries(stdout, ["template"])).toEqual(["template"])
  })

  it("sorts nested command help alphabetically", async () => {
    const { stdout: authHelp } = await execFileAsync(process.execPath, [
      cliPath,
      "auth",
      "--help",
    ])
    const { stdout: templateHelp } = await execFileAsync(process.execPath, [
      cliPath,
      "template",
      "--help",
    ])
    const { stdout: legacyTemplatesHelp } = await execFileAsync(
      process.execPath,
      [cliPath, "templates", "--help"]
    )

    const authExpected = ["help", "login", "logout", "status"]
    const templateExpected = ["help", "info", "init", "list"]
    expect(commandEntries(authHelp, authExpected)).toEqual(authExpected)
    expect(commandEntries(templateHelp, templateExpected)).toEqual(
      templateExpected
    )
    expect(legacyTemplatesHelp).toContain("Usage: deessejs template")
  })
})
