import { Command } from "commander"
import pc from "picocolors"
import { readPackageVersion } from "./api/self-version.js"
import {
	loginCommand,
	logoutCommand,
	statusCommand,
} from "./commands/auth/index.js"
import { initCommand } from "./commands/init.js"
import { listCommand } from "./commands/list.js"
import { infoCommand } from "./commands/info.js"
import {
	explainCommand,
	newCommand,
	validateCommand,
} from "./commands/template/index.js"

const program = new Command()

program
  .name("deessejs")
  .description("CLI for the DeesseJS template registry")
  .version(readPackageVersion())

program.addCommand(listCommand)
program.addCommand(infoCommand)
program.addCommand(initCommand)

// auth subcommand (ADR-020). Three children: login (request
// device code, open browser, poll), status (print stored
// user identity), logout (sign out + clear local token).
const authCommand = new Command("auth").description(
	"Authenticate this machine against the DeesseJS server",
)
authCommand.addCommand(loginCommand)
authCommand.addCommand(statusCommand)
authCommand.addCommand(logoutCommand)
program.addCommand(authCommand)

// template subcommand (ADR-034). Three children: validate (shape
// check, v1), new (scaffold from catalogue, placeholder until
// the registry CDN ships), explain (render JSDoc field docs,
// placeholder until the schema contract lands).
const templateCommand = new Command("template").description(
	"Author tooling for deesse-template.json",
)
templateCommand.addCommand(validateCommand)
templateCommand.addCommand(newCommand)
templateCommand.addCommand(explainCommand)
program.addCommand(templateCommand)

program.parseAsync(process.argv).catch((err) => {
  // Last-resort error handler. Per-command handlers catch CliError and exit
  // cleanly with the right code. Anything that lands here is an uncaught bug.
  process.stderr.write(
    `${pc.red("Internal error")}: ${err instanceof Error ? err.message : String(err)}\n`,
  )
  if (process.env.DEESSEJS_DEBUG) {
    process.stderr.write(`\n${err instanceof Error && err.stack ? err.stack : ""}\n`)
  }
  process.exit(1)
})
