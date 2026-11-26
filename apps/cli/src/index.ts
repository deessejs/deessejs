import { Command } from "commander"
import pc from "picocolors"
import { readPackageVersion } from "./api/self-version.js"
import {
  loginCommand,
  logoutCommand,
  statusCommand,
} from "./commands/auth/index.js"
import { blockCommand } from "./commands/block.js"
import { initCommand } from "./commands/init.js"
import { listCommand } from "./commands/list.js"
import { infoCommand } from "./commands/info.js"
import { organizationCommand } from "./commands/organization.js"
import { updateCommand } from "./commands/update.js"
import { addCommand } from "./commands/add.js"
import { cacheCommand } from "./commands/cache.js"
import { templateVersionCommand } from "./commands/version.js"
import { printError } from "./output/index.js"
import { CliError } from "./errors/index.js"
import { normalizeTemplateCommandArgs } from "./template-command-args.js"
import { templatePublishCommand, blockPublishCommand } from "./commands/publish.js"
import { releasesCommand } from "./commands/releases.js"

const program = new Command()
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (command) => command.name(),
})

const runNamespacedCommand = (command: Command): Promise<void> =>
  command.parseAsync(normalizeTemplateCommandArgs(process.argv)).then(() => {})

program
  .name("deessejs")
  .description("CLI for the DeesseJS template registry and blocks")
  .version(readPackageVersion(), "-V, --version")
  .option("-v", "output the version number")

program.on("option:v", () => {
  process.stdout.write(`${readPackageVersion()}\n`)
  process.exit(0)
})

const templateCommand = new Command("template")
  .alias("templates")
  .description("Browse and create projects from templates")
templateCommand.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (command) => command.name(),
})
templateCommand.addHelpText("after", "\nAlias: templates")
templateCommand.addCommand(templateVersionCommand)
templateCommand.addCommand(templatePublishCommand)
templateCommand.addCommand(releasesCommand)
templateCommand.addCommand(
  new Command("list")
    .description("List available templates")
    .option("--category <name>", "filter to a single category")
    .option("--json", "JSON output for scripting")
    .option("--verbose", "show human-readable output")
    .action(() => runNamespacedCommand(listCommand))
)
templateCommand.addCommand(
  new Command("info")
    .description("Show details for one template")
    .argument(
      "<slug-or-github-url>",
      "template slug or HTTPS URL to a GitHub repository"
    )
    .option("--ref <branch>", "Git ref to inspect")
    .option("--json", "JSON output for scripting")
    .option("--verbose", "show human-readable output")
    .action(() => runNamespacedCommand(infoCommand))
)
templateCommand.addCommand(
  new Command("init")
    .description("Create a project from a template and install dependencies")
    .argument(
      "<slug-or-github-url>",
      "template slug or HTTPS URL to a GitHub repository"
    )
    .option(
      "--pm <name>",
      "override detected package manager (pnpm|npm|yarn|bun)"
    )
    .option("--dir <path>", "target directory")
    .option("--ref <branch>", "git ref to use")
    .option("--organization <slug>", "initialize an organization-owned managed template")
    .option("--no-install", "skip the install step")
    .option("--force", "allow an existing empty target directory")
    .option(
      "--verbose",
      "show initialization details and package manager output"
    )
    .option("--json", "JSON output for scripting")
    .action(() => runNamespacedCommand(initCommand))
)
program.addCommand(templateCommand)
program.addCommand(blockCommand)
blockCommand.addCommand(blockPublishCommand)
program.addCommand(addCommand)
program.addCommand(cacheCommand)
program.addCommand(organizationCommand)
program.addCommand(updateCommand)

// auth subcommand (the device-authorization flow). Three children: login (request
// device code, open browser, poll), status (print stored
// user identity), logout (sign out + clear local token).
const authCommand = new Command("auth").description(
  "Authenticate this machine against the DeesseJS server"
)
authCommand.configureHelp({ sortSubcommands: true })
authCommand.addCommand(loginCommand)
authCommand.addCommand(statusCommand)
authCommand.addCommand(logoutCommand)
program.addCommand(authCommand)

program.parseAsync(process.argv).catch((err: unknown) => {
  if (err instanceof CliError) {
    printError(err)
    process.exit(err.exitCode())
  }
  // Last-resort error handler. Per-command handlers catch CliError and exit
  // cleanly with the right code. Anything that lands here is an uncaught bug.
  process.stderr.write(
    `${pc.red("Internal error")}: ${err instanceof Error ? err.message : String(err)}\n`
  )
  if (process.env.DEESSEJS_DEBUG) {
    process.stderr.write(
      `\n${err instanceof Error && err.stack ? err.stack : ""}\n`
    )
  }
  process.exit(1)
})
