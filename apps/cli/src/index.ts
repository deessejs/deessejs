import { Command } from "commander"
import pc from "picocolors"
import { DEFAULT_API_URL, USER_AGENT } from "./constants.js"
import { initCommand } from "./commands/init.js"
import { listCommand } from "./commands/list.js"
import { infoCommand } from "./commands/info.js"

const program = new Command()

program
  .name("deessejs")
  .description("CLI for the DeesseJS template registry")
  .version("0.1.0")
  .option("--api-url <url>", "API base URL (the oRPC client appends the procedure path)", process.env.DEESSEJS_API_URL ?? DEFAULT_API_URL)

program.addCommand(listCommand)
program.addCommand(infoCommand)
program.addCommand(initCommand)

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

void USER_AGENT // re-exported for downstream consumers if needed