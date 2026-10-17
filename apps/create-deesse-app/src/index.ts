import { resolve } from "node:path"

import { Command } from "commander"

import {
  CliError,
  type CreateAppErrorCode,
  internal,
  sourceFailed,
} from "./errors/index.js"
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
    "Initialize a new DeesseJS project from the current main of deessejs/saas-template. See https://docs.deessejs.com/getting-started",
  )
  .argument("<project-name>", "project name (lowercase, dash-separated)")
  .option("--dir <path>", "target directory (default: ./<project-name>)")
  .option("--no-install", "skip the install step")
  .version(readPackageVersion())
  .allowExcessArguments(false)
  .action(
    async (
      projectName: string,
      opts: { dir?: string; install: boolean },
    ) => {
      try {
        const dir = resolve(process.cwd(), opts.dir ?? `./${projectName}`)
        const result = await run({ projectName, dir, install: opts.install })

        // Mirror the human message to stderr BEFORE the JSON result.
        // For success this is a no-op. For install-failure, the
        // install-log mirror is emitted here. For other failures
        // (destination_exists, invalid_name, etc.) we surface the
        // CliError via printError. This guarantees a human at the
        // terminal always sees *something* on stderr explaining the
        // failure, in addition to the structured JSON on stdout.
        if (!result.ok) {
          if (result.error.code === "install_failed") {
            // The CreateInstallFailure variant carries installOutput,
            // recovery, and destination as required fields. Narrowing
            // here requires a cast because `error.code` is `string`,
            // not a strict literal type on the union.
            const installFailure = result as Extract<
              typeof result,
              { error: { code: "install_failed" } }
            >
            printInstallLog({
              code: installFailure.installOutput.code,
              stderr: installFailure.installOutput.stderr,
              stdout: installFailure.installOutput.stdout,
              recovery: installFailure.recovery,
              destination: installFailure.destination,
            })
          } else {
            printError(
              new CliError(
                result.error.code as CreateAppErrorCode,
                result.error.message,
                result.error.hint,
              ),
            )
          }
        }

        printResult(result)
        // Set exit code via process.exitCode (no process.exit call — lets stdio drain).
        process.exitCode = result.ok ? 0 : 1
      } catch (err) {
        // Last-resort: any error that escaped the pipeline's own catch.
        const e = err instanceof Error ? err : new Error(String(err))
        const code =
          e instanceof CliError ? e.code : sourceFailed(e.message).code
        const failure: CreateResult = {
          ok: false,
          mode: "create",
          projectCreated: false,
          error: {
            code,
            message: e.message,
            hint:
              e instanceof CliError
                ? e.hint
                : "unexpected internal error — check the output above",
          },
        }
        printError(e instanceof CliError ? e : internal(e.message))
        printResult(failure)
        process.exitCode = 1
      }
    },
  )

program.parseAsync(process.argv).catch((err) => {
  // Top-level safety net for anything commander didn't route.
  const e = err instanceof Error ? err : new Error(String(err))
  printError(e instanceof CliError ? e : internal(e.message))
  printResult({
    ok: false,
    mode: "create",
    projectCreated: false,
    error: { code: "internal", message: e.message, hint: undefined },
  } satisfies CreateResult)
  process.exitCode = 1
})
