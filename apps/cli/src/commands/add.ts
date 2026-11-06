import { Command } from "commander"
import { runAddBlock } from "../utils/add-block.js"

export const addCommand = new Command("add")
  .description(
    "Add a published, GitHub, or local block to a selected project package"
  )
  .argument(
    "<source>",
    "published block slug, GitHub repository/directory URL, or local block directory"
  )
  .requiredOption("--target <id>", "package target id declared in deesse.json")
  .option("--ref <ref>", "Git ref for a GitHub source")
  .option("--dry-run", "print the plan without writing files")
  .option(
    "--install",
    "optionally install dependencies after applying the plan"
  )
  .action(
    async (
      input: string,
      options: {
        target: string
        ref?: string
        dryRun?: boolean
        install?: boolean
      }
    ) => {
      await runAddBlock(input, options)
    }
  )
