import { Command } from "commander"
import pc from "picocolors"
import { printJson } from "../output/index.js"
import { createUpdatePlan, runGlobalUpdate } from "./update/action.js"
import { detectCliInstallation } from "./update/installation.js"
import {
  compareStableCliVersions,
  fetchLatestStableCliVersion,
} from "./update/version.js"
import type { UpdateCheckError } from "./update/version.js"
import { readPackageVersion } from "../api/self-version.js"
import { CLI_PACKAGE_NAME } from "./update/constants.js"
import type { UpdateCommandDependencies, UpdateResult } from "./update/types.js"

const defaultDependencies: UpdateCommandDependencies = {
  readCurrentVersion: readPackageVersion,
  fetchLatestVersion: fetchLatestStableCliVersion,
  detectInstallation: detectCliInstallation,
  runUpdate: runGlobalUpdate,
  writeJson: printJson,
  writeHuman: (message) => console.log(message),
  writeError: (message) => process.stderr.write(`${message}\n`),
}

/**
 * Orchestrates one explicit update check: read the bundled version, fetch the
 * stable npm version, short-circuit when current, then detect installation and
 * execute or report the selected plan. Installation probing is intentionally
 * skipped when no update exists. The injected dependencies make network,
 * process, and output behavior testable without touching the host environment.
 *
 * @param verbose - Selects human output; false writes one JSON result to stdout.
 * @param dependencies - Production services or deterministic test substitutes.
 * @returns CLI exit code: `0` for current, updated, or guidance-only outcomes;
 * `1` for lookup or installer failure.
 */
export const executeUpdateCommand = async (
  verbose: boolean,
  dependencies: UpdateCommandDependencies = defaultDependencies
): Promise<number> => {
  const currentVersion = dependencies.readCurrentVersion()
  let latestVersion: string
  try {
    latestVersion = await dependencies.fetchLatestVersion()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const code = isUpdateCheckError(error) ? error.code : "registry_error"
    if (verbose)
      dependencies.writeError(`${pc.red("Update check failed")}: ${message}`)
    else dependencies.writeJson({ ok: false, code, message })
    return 1
  }

  const updateAvailable =
    compareStableCliVersions(latestVersion, currentVersion) > 0
  if (!updateAvailable) {
    const result: UpdateResult = {
      status: "up-to-date",
      ok: true,
      currentVersion,
      latestVersion,
      channel: "latest",
      updated: false,
    }
    writeResult(result, verbose, dependencies)
    return 0
  }

  const installation = await dependencies.detectInstallation()
  const plan = createUpdatePlan(installation, currentVersion, latestVersion)
  const result =
    plan.kind === "run-global-update"
      ? await dependencies.runUpdate(plan)
      : {
          status: "update-available" as const,
          ok: true as const,
          currentVersion,
          latestVersion,
          channel: "latest" as const,
          installation: plan.installation,
          updated: false as const,
          manualCommand: plan.manualCommand,
        }
  writeResult(result, verbose, dependencies)
  return result.ok ? 0 : 1
}

/**
 * Narrows version-lookup failures to their public error-code contract. Other
 * thrown values are treated as registry failures at the command boundary.
 *
 * @param error - Unknown value caught from the version lookup.
 * @returns Whether the error carries a recognized update-check code.
 */
const isUpdateCheckError = (error: unknown): error is UpdateCheckError =>
  typeof error === "object" && error !== null && "code" in error

/**
 * Sends a completed update result through exactly one output path. JSON mode
 * writes the machine result only; verbose mode renders the equivalent state as
 * prose. Child-process diagnostics are emitted separately by the spawn helper.
 *
 * @param result - Completed up-to-date, updated, guidance, or failure state.
 * @param verbose - Human-readable output selector.
 * @param dependencies - Output writers supplied by the command boundary.
 */
const writeResult = (
  result: UpdateResult,
  verbose: boolean,
  dependencies: UpdateCommandDependencies
): void => {
  if (!verbose) {
    dependencies.writeJson(result)
    return
  }
  dependencies.writeHuman(formatHumanResult(result))
}

/**
 * Formats a result for `--verbose`, preserving actionable recovery guidance for
 * failures and ephemeral/unknown installs instead of implying an update ran.
 *
 * @param result - Explicit result state to present.
 * @returns Human-readable message; callers decide which stream receives errors.
 */
const formatHumanResult = (result: UpdateResult): string => {
  if (result.status === "up-to-date") {
    return `${CLI_PACKAGE_NAME} is up to date (${result.currentVersion}).`
  }
  if (result.status === "updated") {
    return `Updated ${CLI_PACKAGE_NAME} to ${result.latestVersion}.`
  }
  if (result.status === "update-failed") {
    return `Update to ${result.latestVersion} failed: ${result.message}\nTry again with: ${result.manualCommand}`
  }
  const reason =
    result.installation === "ephemeral"
      ? "This is an ephemeral launcher. Rerun it to use the latest version."
      : "The CLI installation method could not be identified."
  return `Update available: ${result.currentVersion} → ${result.latestVersion}. ${reason}\nRun: ${result.manualCommand}`
}

export const updateCommand = new Command("update")
  .alias("upgrade")
  .description("Check for updates and update a recognized global install")
  .option("--verbose", "show human-readable update details")
  .action(async (options: { verbose?: boolean }) => {
    const exitCode = await executeUpdateCommand(options.verbose ?? false)
    if (exitCode !== 0) process.exitCode = exitCode
  })
