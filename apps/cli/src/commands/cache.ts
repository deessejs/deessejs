import { Command } from "commander"
import { clearResponseCache } from "../cache/index.js"

export const cacheCommand = new Command("cache").description("Manage local CLI response cache")
cacheCommand.configureHelp({ sortSubcommands: true })
cacheCommand.addCommand(
  new Command("clear")
    .description("Clear cached template catalog responses (authentication is preserved)")
    .action(() => {
      const removed = clearResponseCache()
      process.stdout.write(removed === 0 ? "No cached responses to clear.\n" : `Cleared ${removed} cached response${removed === 1 ? "" : "s"}.\n`)
    })
)
