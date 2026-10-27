import { Command } from "commander"
import ora from "ora"

import { internal } from "../errors/index.js"
import {
  printBlockInfo,
  printBlockCheck,
  printError,
  printJson,
} from "../output/index.js"
import {
  checkBlockSource,
  resolveBlockDescriptorInfo,
} from "../utils/resolve-block-info.js"

export const blockCommand = new Command("block").description(
  "Inspect DeesseJS blocks"
)

const blockInfoCommand = new Command("info")
  .description("Show details for one block")
  .argument(
    "<directory-or-github-url>",
    "local block directory or HTTPS GitHub repository/directory URL"
  )
  .option(
    "--ref <git-ref>",
    "Git ref to inspect (defaults to the URL ref or repository default branch)"
  )
  .option("--json", "JSON output for scripting")
  .action(
    async (
      source: string,
      options: { ref?: string; json?: boolean }
    ) => {
      const spinner = options.json
        ? null
        : ora("Reading block details...").start()

      try {
        const info = await resolveBlockDescriptorInfo(source, {
          ...(options.ref ? { ref: options.ref } : {}),
        })
        spinner?.succeed("Block details loaded")

        if (options.json) {
          printJson({
            ok: true,
            command: "block info",
            ...info,
          })
        } else {
          printBlockInfo(info)
        }
      } catch (error) {
        spinner?.fail("Failed to read block details")
        if (error instanceof Error && error.name === "CliError") {
          if (options.json) {
            printJson({
              ok: false,
              code: (error as { code?: string }).code,
              message: error.message,
              hint: (error as { hint?: string }).hint,
            })
          } else {
            printError(error as Parameters<typeof printError>[0])
          }
          process.exit((error as { exitCode?: () => number }).exitCode?.() ?? 1)
        }
        throw internal(error instanceof Error ? error.message : String(error))
      }
    }
  )

const blockCheckCommand = new Command("check")
  .description("Validate a block descriptor and all referenced source files")
  .argument(
    "[directory-or-github-url]",
    "local block directory or supported HTTPS GitHub source",
    "."
  )
  .option(
    "--ref <git-ref>",
    "Git ref to check (defaults to the URL ref or repository default branch)"
  )
  .option("--json", "JSON output for scripting")
  .action(
    async (
      source: string,
      options: { ref?: string; json?: boolean }
    ) => {
      const spinner = options.json
        ? null
        : ora("Checking block source...").start()

      try {
        const result = await checkBlockSource(source, {
          ...(options.ref ? { ref: options.ref } : {}),
        })
        const valid = result.diagnostics.length === 0

        if (options.json) {
          printJson({
            ok: valid,
            command: "block check",
            ...result,
          })
        } else {
          if (valid) spinner?.succeed("Block source is valid")
          else spinner?.fail("Block source validation failed")
          printBlockCheck(result)
        }

        if (!valid) process.exitCode = 1
      } catch (error) {
        spinner?.fail("Failed to check block source")
        if (error instanceof Error && error.name === "CliError") {
          if (options.json) {
            printJson({
              ok: false,
              command: "block check",
              code: (error as { code?: string }).code,
              message: error.message,
              hint: (error as { hint?: string }).hint,
            })
          } else {
            printError(error as Parameters<typeof printError>[0])
          }
          process.exit((error as { exitCode?: () => number }).exitCode?.() ?? 1)
        }
        throw internal(error instanceof Error ? error.message : String(error))
      }
    }
  )

blockCommand.addCommand(blockInfoCommand)
blockCommand.addCommand(blockCheckCommand)
