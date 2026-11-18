import { Command } from "commander"
import { executeUpdateCommand } from "./update/command.js"

/**
 * Commander entry point for the explicit self-update operation. The command
 * delegates all lookup, policy, side effects, and output orchestration to the
 * update command module so this registration file remains a thin CLI adapter.
 */
export const updateCommand = new Command("update")
  .alias("upgrade")
  .description("Check for updates and update a recognized global install")
  .option("--verbose", "show human-readable update details")
  .action(async (options: { verbose?: boolean }) => {
    const exitCode = await executeUpdateCommand(options.verbose ?? false)
    if (exitCode !== 0) process.exitCode = exitCode
  })
