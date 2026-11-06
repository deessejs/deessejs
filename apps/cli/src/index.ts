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
import { printError } from "./output/index.js"
import { CliError } from "./errors/index.js"
import { normalizeTemplateCommandArgs } from "./template-command-args.js"

const program = new Command()

program
  .name("deessejs")
  .description("CLI for the DeesseJS template registry and blocks")
  .addHelpText(
    "after",
    "\nTemplate commands: deessejs templates list|info|init. The root list, info, and init forms remain supported.\n"
  )
  .version(readPackageVersion())

program.addCommand(listCommand)
program.addCommand(infoCommand)
program.addCommand(initCommand)
program.addCommand(blockCommand)
program.addCommand(addCommand)
program.addCommand(organizationCommand)
program.addCommand(updateCommand)

// auth subcommand (the device-authorization flow). Three children: login (request
// device code, open browser, poll), status (print stored
// user identity), logout (sign out + clear local token).
const authCommand = new Command("auth").description(
  "Authenticate this machine against the DeesseJS server"
)
authCommand.addCommand(loginCommand)
authCommand.addCommand(statusCommand)
authCommand.addCommand(logoutCommand)
program.addCommand(authCommand)

program
  .parseAsync(normalizeTemplateCommandArgs(process.argv))
  .catch((err: unknown) => {
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
