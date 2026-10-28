import { Command } from "commander"
import ora from "ora"

import { CliError, internal } from "../errors/index.js"
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
  .action(async (source: string, options: { ref?: string; json?: boolean }) => {
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
      if (error instanceof CliError) {
        if (options.json) {
          printJson({
            ok: false,
            code: error.code,
            message: error.message,
            hint: error.hint,
          })
        } else {
          printError(error)
        }
        process.exit(error.exitCode())
      }
      throw internal(error instanceof Error ? error.message : String(error))
    }
  })

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
  .action((source: string, options: BlockCommandOptions) =>
    runBlockCheck(source, options)
  )

blockCommand.addCommand(blockInfoCommand)
blockCommand.addCommand(blockCheckCommand)

type BlockCommandOptions = { ref?: string; json?: boolean }
type BlockSpinner = ReturnType<typeof ora> | null

async function runBlockCheck(
  source: string,
  options: BlockCommandOptions
): Promise<void> {
  const spinner = options.json ? null : ora("Checking block source...").start()
  try {
    const result = await checkBlockSource(source, {
      ...(options.ref ? { ref: options.ref } : {}),
    })
    reportBlockCheck(result, options.json ?? false, spinner)
  } catch (error) {
    handleBlockCheckError(error, options.json ?? false, spinner)
  }
}

function reportBlockCheck(
  result: Awaited<ReturnType<typeof checkBlockSource>>,
  json: boolean,
  spinner: BlockSpinner
): void {
  const valid = result.diagnostics.length === 0
  if (json) {
    printJson({ ok: valid, command: "block check", ...result })
  } else {
    if (valid) spinner?.succeed("Block source is valid")
    else spinner?.fail("Block source validation failed")
    printBlockCheck(result)
  }
  if (!valid) process.exitCode = 1
}

function handleBlockCheckError(
  error: unknown,
  json: boolean,
  spinner: BlockSpinner
): never {
  spinner?.fail("Failed to check block source")
  if (!(error instanceof CliError)) {
    throw internal(error instanceof Error ? error.message : String(error))
  }
  if (json) {
    printJson({
      ok: false,
      command: "block check",
      code: error.code,
      message: error.message,
      hint: error.hint,
    })
  } else {
    printError(error)
  }
  process.exit(error.exitCode())
}
