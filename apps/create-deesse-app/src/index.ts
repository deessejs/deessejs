import { resolve } from "node:path"

import { Command } from "commander"

import { CliError, internal, sourceFailed } from "./errors/index.js"
import { printError, printResult } from "./output/index.js"
import { printInstallLog } from "./output/print-install-log.js"
import { run } from "./pipeline.js"
import type { CreateResult } from "./result.js"
import { readPackageVersion } from "./utils/package-version.js"

// Pre-parse `--version` and `-v` BEFORE Commander sees argv. Commander
// 12's default version flag is `--version` / `-V` (uppercase). The
// senior review asked for `-v` (lowercase) too — the npm convention.
// Handling it as a pre-parse keeps the version flag a one-shot, exits
// cleanly with code 0, and never runs the pipeline.
const versionArgs = process.argv.slice(2)
if (versionArgs.includes("--version") || versionArgs.includes("-v")) {
  process.stdout.write(readPackageVersion() + "\n")
  process.exit(0)
}

const program = new Command()

program
  .name("create-deesse-app")
  .description(
    "Initialize a new DeesseJS project from the current main of deessejs/saas-template. See https://docs.deessejs.com/getting-started"
  )
  .argument("<project-name>", "project name (lowercase, dash-separated)")
  .option("--dir <path>", "target directory (default: ./<project-name>)")
  .option("--no-install", "skip the install step")
  .option(
    "--dry-run",
    "plan the create without writing files, running install, or executing template code"
  )
  .option(
    "--verbose",
    "print human-readable progress to stderr (does not change JSON or exit semantics)"
  )
  .version(readPackageVersion())
  .allowExcessArguments(false)
  .action(
    async (
      projectName: string,
      opts: {
        dir?: string
        install: boolean
        dryRun: boolean
        verbose: boolean
      }
    ) => {
      try {
        const dir = resolve(process.cwd(), opts.dir ?? `./${projectName}`)
        const result = await run({
          projectName,
          dir,
          install: opts.install,
          dryRun: opts.dryRun,
          verbose: opts.verbose,
        })
        reportCreateResult(result)
      } catch (err) {
        reportUnexpectedError(err, opts.dryRun)
      }
    }
  )

function reportCreateResult(result: CreateResult): void {
  if (!result.ok) {
    if (result.error.code === "install_failed" && "installOutput" in result) {
      printInstallLog({
        code: result.installOutput.code,
        stderr: result.installOutput.stderr,
        stdout: result.installOutput.stdout,
        recovery: result.recovery,
        destination: result.destination,
      })
    } else {
      printError(
        new CliError(result.error.code, result.error.message, result.error.hint)
      )
    }
  }

  printResult(result)
  process.exitCode = result.ok ? 0 : 1
}

function reportUnexpectedError(err: unknown, dryRun: boolean): void {
  const error = err instanceof Error ? err : new Error(String(err))
  const code =
    error instanceof CliError ? error.code : sourceFailed(error.message).code
  const failure: CreateResult = {
    ok: false,
    mode: dryRun ? "dry-run" : "create",
    projectCreated: false,
    error: {
      code,
      message: error.message,
      hint:
        error instanceof CliError
          ? error.hint
          : "unexpected internal error — check the output above",
    },
  }
  printError(error instanceof CliError ? error : internal(error.message))
  printResult(failure)
  process.exitCode = 1
}

program.parseAsync(process.argv).catch((err) => {
  // Top-level safety net for anything commander didn't route.
  const e = err instanceof Error ? err : new Error(String(err))
  // Commander rejected argv before the action ran, so we do
  // not have the user's `--dry-run` flag here. The default
  // ("create") matches what a real `commander` parse error
  // would have produced pre-dry-run; if the user passed
  // `--dry-run` AND a malformed flag, the failure is a
  // commander error, not a pipeline one, and `mode: "create"`
  // is the right shape.
  const dryRunFromArgv = process.argv.includes("--dry-run")
  printError(e instanceof CliError ? e : internal(e.message))
  printResult({
    ok: false,
    mode: dryRunFromArgv ? "dry-run" : "create",
    projectCreated: false,
    error: { code: "internal", message: e.message, hint: undefined },
  } satisfies CreateResult)
  process.exitCode = 1
})
