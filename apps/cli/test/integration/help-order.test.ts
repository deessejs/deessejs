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
  it("sorts root commands alphabetically and retains aliases", async () => {
    const { stdout } = await execFileAsync(process.execPath, [cliPath, "help"])

    const expected = [
      "add",
      "auth",
      "block",
      "cache",
      "help",
      "organization",
      "templates",
      "update|upgrade",
    ]
    expect(commandEntries(stdout, expected)).toEqual(expected)
  })

  it("sorts nested command help alphabetically", async () => {
    const { stdout: authHelp } = await execFileAsync(process.execPath, [
      cliPath,
      "auth",
      "--help",
    ])
    const { stdout: templatesHelp } = await execFileAsync(process.execPath, [
      cliPath,
      "templates",
      "--help",
    ])

    const authExpected = ["help", "login", "logout", "status"]
    const templatesExpected = ["help", "info", "init", "list"]
    expect(commandEntries(authHelp, authExpected)).toEqual(authExpected)
    expect(commandEntries(templatesHelp, templatesExpected)).toEqual(
      templatesExpected
    )
  })
})
