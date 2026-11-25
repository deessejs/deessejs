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
  .option(
    "--organization <slug>",
    "resolve an organization-owned block release"
  )
  .option("--dry-run", "print the plan without writing files")
  .option(
    "--install",
    "optionally install dependencies after applying the plan"
  )
  .option("--yes", "confirm and apply the plan without an interactive prompt")
  .option("--json", "JSON output for scripting")
  .option("--verbose", "show the file plan and human-readable output")
  .action(
    async (
      input: string,
      options: {
        target: string
        ref?: string
        organization?: string
        dryRun?: boolean
        install?: boolean
        yes?: boolean
        json?: boolean
        verbose?: boolean
      }
    ) => {
      await runAddBlock(input, {
        ...options,
        json: !options.verbose || !!options.json,
      })
    }
  )
