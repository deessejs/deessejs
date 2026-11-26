import { Command } from "commander"
import { CliError } from "../errors/index.js"
import { printError } from "../output/index.js"
import { bumpLocalTemplateVersion } from "../utils/template-version.js"

async function runVersionBump(release: "major" | "minor" | "patch") {
  try {
    const result = await bumpLocalTemplateVersion(process.cwd(), release)
    console.log(
      `Updated deesse-template.json: ${result.previousVersion} -> ${result.version}`
    )
  } catch (error) {
    const cliError =
      error instanceof CliError
        ? error
        : new CliError(
            "template_invalid",
            "the local template version could not be updated",
            error instanceof Error ? error.message : String(error),
            error instanceof Error ? error : undefined
          )
    printError(cliError)
    process.exitCode = cliError.exitCode()
  }
}

function releaseCommand(release: "major" | "minor" | "patch") {
  return new Command(release)
    .description(`Bump the local template version by one ${release} release`)
    .action(() => runVersionBump(release))
}

export const templateVersionCommand = new Command("version")
  .description("Bump the local template descriptor version")
  .addCommand(releaseCommand("patch"))
  .addCommand(releaseCommand("minor"))
  .addCommand(releaseCommand("major"))

templateVersionCommand.configureHelp({ sortSubcommands: true })
