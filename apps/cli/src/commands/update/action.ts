import { spawnResult } from "../../utils/spawn.js"
import type { CliInstallation, GlobalPackageManager } from "./installation.js"
import { compareStableCliVersions } from "./version.js"

const PACKAGE_NAME = "@deessejs/cli"

export type UpdatePlan =
  | {
      kind: "run-global-update"
      manager: GlobalPackageManager
      currentVersion: string
      latestVersion: string
      command: string
      args: string[]
    }
  | {
      kind: "show-manual-command"
      installation: "unknown" | "ephemeral"
      currentVersion: string
      latestVersion: string
      manualCommand: string
    }

export type UpdateResult =
  | { status: "up-to-date"; ok: true; currentVersion: string; latestVersion: string; channel: "latest"; updated: false }
  | { status: "updated"; ok: true; currentVersion: string; latestVersion: string; channel: "latest"; installation: "npm" | "pnpm"; updated: true }
  | { status: "update-available"; ok: true; currentVersion: string; latestVersion: string; channel: "latest"; installation: "unknown" | "ephemeral"; updated: false; manualCommand: string }
  | { status: "update-failed"; ok: false; code: "update_failed"; currentVersion: string; latestVersion: string; channel: "latest"; installation: "npm" | "pnpm"; updated: false; manualCommand: string; message: string }

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
          ? ["install", "-g", `${PACKAGE_NAME}@latest`]
          : ["add", "-g", `${PACKAGE_NAME}@latest`],
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

export const getManualUpdateCommand = (
  installation: Exclude<CliInstallation, { kind: "global" }>
): string => {
  if (installation.kind === "ephemeral" && installation.launcher === "npx") {
    return `npx ${PACKAGE_NAME}@latest`
  }
  if (installation.kind === "ephemeral") {
    return `pnpm dlx ${PACKAGE_NAME}@latest`
  }
  return `npm install -g ${PACKAGE_NAME}@latest`
}

export const runGlobalUpdate = async (
  plan: Extract<UpdatePlan, { kind: "run-global-update" }>,
  runCommand: typeof spawnResult = spawnResult
): Promise<UpdateResult> => {
  const base = {
    currentVersion: plan.currentVersion,
    latestVersion: plan.latestVersion,
    channel: "latest" as const,
    installation: plan.manager,
    updated: false as const,
    manualCommand: plan.manager === "npm"
      ? `npm install -g ${PACKAGE_NAME}@latest`
      : `pnpm add -g ${PACKAGE_NAME}@latest`,
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
