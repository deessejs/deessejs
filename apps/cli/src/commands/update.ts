import { Command } from "commander"
import pc from "picocolors"
import { printJson } from "../output/index.js"
import { createUpdatePlan, runGlobalUpdate } from "./update/action.js"
import type { UpdateResult } from "./update/action.js"
import { detectCliInstallation } from "./update/installation.js"
import type { CliInstallation } from "./update/installation.js"
import { compareStableCliVersions, fetchLatestStableCliVersion } from "./update/version.js"
import type { UpdateCheckError } from "./update/version.js"
import { readPackageVersion } from "../api/self-version.js"

export type UpdateCommandDependencies = {
  readCurrentVersion: () => string
  fetchLatestVersion: typeof fetchLatestStableCliVersion
  detectInstallation: () => Promise<CliInstallation>
  runUpdate: typeof runGlobalUpdate
  writeJson: (value: unknown) => void
  writeHuman: (message: string) => void
  writeError: (message: string) => void
}

const defaultDependencies: UpdateCommandDependencies = {
  readCurrentVersion: readPackageVersion,
  fetchLatestVersion: fetchLatestStableCliVersion,
  detectInstallation: detectCliInstallation,
  runUpdate: runGlobalUpdate,
  writeJson: printJson,
  writeHuman: (message) => console.log(message),
  writeError: (message) => process.stderr.write(`${message}\n`),
}

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
    if (verbose) dependencies.writeError(`${pc.red("Update check failed")}: ${message}`)
    else dependencies.writeJson({ ok: false, code, message })
    return 1
  }

  const updateAvailable = compareStableCliVersions(latestVersion, currentVersion) > 0
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
  const result = plan.kind === "run-global-update"
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

const isUpdateCheckError = (error: unknown): error is UpdateCheckError =>
  typeof error === "object" && error !== null && "code" in error

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

const formatHumanResult = (result: UpdateResult): string => {
  if (result.status === "up-to-date") {
    return `@deessejs/cli is up to date (${result.currentVersion}).`
  }
  if (result.status === "updated") {
    return `Updated @deessejs/cli to ${result.latestVersion}.`
  }
  if (result.status === "update-failed") {
    return `Update to ${result.latestVersion} failed: ${result.message}\nTry again with: ${result.manualCommand}`
  }
  const reason = result.installation === "ephemeral"
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
