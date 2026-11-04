import { spawnResult } from "../../utils/spawn.js"
import { CLI_PACKAGE_NAME, STABLE_DIST_TAG } from "./constants.js"
import type {
  CliInstallation,
  RunGlobalUpdatePlan,
  UpdatePlan,
  UpdateResult,
} from "./types.js"
import { compareStableCliVersions } from "./version.js"

/**
 * Converts the observed installation context and stable-version comparison into
 * one explicit action. This function has no side effects: callers can inspect
 * the returned plan before deciding whether to execute a package-manager
 * subprocess or show a manual command.
 *
 * The caller should only invoke this after confirming that `latestVersion` is
 * newer; the comparison is repeated here as a guard against accidental installs
 * if another caller violates that precondition.
 *
 * @param installation - Classified persistent, ephemeral, or unknown context.
 * @param currentVersion - Version embedded in the running CLI bundle.
 * @param latestVersion - Stable version read from npm's `latest` dist-tag.
 * @returns A global-update plan or a manual-guidance plan.
 * @throws {Error} If the provided latest version is not newer than current.
 */
export const createUpdatePlan = (
  installation: CliInstallation,
  currentVersion: string,
  latestVersion: string
): UpdatePlan => {
  if (compareStableCliVersions(latestVersion, currentVersion) <= 0) {
    throw new Error("createUpdatePlan requires a newer stable version")
  }
  if (installation.kind === "global") {
    return {
      kind: "run-global-update",
      manager: installation.manager,
      currentVersion,
      latestVersion,
      command: installation.manager,
      args:
        installation.manager === "npm"
          ? ["install", "-g", `${CLI_PACKAGE_NAME}@${STABLE_DIST_TAG}`]
          : ["add", "-g", `${CLI_PACKAGE_NAME}@${STABLE_DIST_TAG}`],
    }
  }
  return {
    kind: "show-manual-command",
    installation: installation.kind,
    currentVersion,
    latestVersion,
    manualCommand: getManualUpdateCommand(installation),
  }
}

/**
 * Produces the command a user can run when this process must not mutate an
 * installation, either because its context is ephemeral or cannot be proven.
 *
 * @param installation - A non-global installation classification.
 * @returns A concrete command that targets the selected stable channel.
 */
export const getManualUpdateCommand = (
  installation: Exclude<CliInstallation, { kind: "global" }>
): string => {
  if (installation.kind === "ephemeral" && installation.launcher === "npx") {
    return `npx ${CLI_PACKAGE_NAME}@${STABLE_DIST_TAG}`
  }
  if (installation.kind === "ephemeral") {
    return `pnpm dlx ${CLI_PACKAGE_NAME}@${STABLE_DIST_TAG}`
  }
  return `npm install -g ${CLI_PACKAGE_NAME}@${STABLE_DIST_TAG}`
}

/**
 * Runs the package-manager action selected for a positively identified global
 * install. Child output is routed by the shared spawn helper to stderr so JSON
 * mode remains parseable. A non-zero exit, signal, or spawn error becomes an
 * explicit failed result with a recovery command; it never looks like success.
 *
 * @param plan - A validated plan containing the manager and exact arguments.
 * @param runCommand - Injectable process runner for deterministic tests.
 * @returns Updated or failed result. Failures are values so the command layer
 * can render them consistently and return a non-zero CLI exit code.
 */
export const runGlobalUpdate = async (
  plan: RunGlobalUpdatePlan,
  runCommand: typeof spawnResult = spawnResult
): Promise<UpdateResult> => {
  const base = {
    currentVersion: plan.currentVersion,
    latestVersion: plan.latestVersion,
    channel: "latest" as const,
    installation: plan.manager,
    updated: false as const,
    manualCommand:
      plan.manager === "npm"
        ? `npm install -g ${CLI_PACKAGE_NAME}@${STABLE_DIST_TAG}`
        : `pnpm add -g ${CLI_PACKAGE_NAME}@${STABLE_DIST_TAG}`,
  }
  try {
    const child = await runCommand(plan.command, plan.args, { stdio: "pipe" })
    if (child.code !== 0 || child.signal) {
      return {
        status: "update-failed",
        ok: false,
        code: "update_failed",
        ...base,
        message: child.signal
          ? `The package manager was interrupted (${child.signal}).`
          : `The package manager exited with code ${child.code ?? 1}.`,
      }
    }
    return {
      status: "updated",
      ok: true,
      currentVersion: plan.currentVersion,
      latestVersion: plan.latestVersion,
      channel: "latest",
      installation: plan.manager,
      updated: true,
    }
  } catch (error) {
    return {
      status: "update-failed",
      ok: false,
      code: "update_failed",
      ...base,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}
