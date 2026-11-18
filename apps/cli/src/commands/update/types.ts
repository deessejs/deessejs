export type GlobalPackageManager = "npm" | "pnpm"
export type EphemeralLauncher = "npx" | "pnpm-dlx"

export type GlobalInstallation = {
  kind: "global"
  manager: GlobalPackageManager
  globalRoot: string
}

export type EphemeralInstallation = {
  kind: "ephemeral"
  launcher: EphemeralLauncher
}

export type UnknownInstallation = { kind: "unknown" }

export type CliInstallation =
  | GlobalInstallation
  | EphemeralInstallation
  | UnknownInstallation

export type CommandOutput = { code: number | null; stdout: string }
export type RunCommandAndCaptureStdout = (
  command: string,
  args: string[]
) => Promise<CommandOutput>

export type InstallationDetectionOptions = {
  packageRoot?: string
  executablePath?: string
  userAgent?: string
  runCommand?: RunCommandAndCaptureStdout
}

export type RunGlobalUpdatePlan = {
  kind: "run-global-update"
  manager: GlobalPackageManager
  currentVersion: string
  latestVersion: string
  command: string
  args: string[]
}

export type ShowManualCommandPlan = {
  kind: "show-manual-command"
  installation: "unknown" | "ephemeral"
  currentVersion: string
  latestVersion: string
  manualCommand: string
}

export type UpdatePlan = RunGlobalUpdatePlan | ShowManualCommandPlan

export type UpToDateResult = {
  status: "up-to-date"
  ok: true
  currentVersion: string
  latestVersion: string
  channel: "latest"
  updated: false
}

export type UpdatedResult = {
  status: "updated"
  ok: true
  currentVersion: string
  latestVersion: string
  channel: "latest"
  installation: GlobalPackageManager
  updated: true
}

export type UpdateAvailableResult = {
  status: "update-available"
  ok: true
  currentVersion: string
  latestVersion: string
  channel: "latest"
  installation: "unknown" | "ephemeral"
  updated: false
  manualCommand: string
}

export type UpdateFailedResult = {
  status: "update-failed"
  ok: false
  code: "update_failed"
  currentVersion: string
  latestVersion: string
  channel: "latest"
  installation: GlobalPackageManager
  updated: false
  manualCommand: string
  message: string
}

export type UpdateResult =
  | UpToDateResult
  | UpdatedResult
  | UpdateAvailableResult
  | UpdateFailedResult

export type UpdateCheckErrorCode =
  | "registry_error"
  | "invalid_registry_response"

export type UpdateCommandDependencies = {
  readCurrentVersion: () => string
  fetchLatestVersion: () => Promise<string>
  detectInstallation: () => Promise<CliInstallation>
  runUpdate: (plan: RunGlobalUpdatePlan) => Promise<UpdateResult>
  writeJson: (value: unknown) => void
  writeHuman: (message: string) => void
  writeError: (message: string) => void
}
