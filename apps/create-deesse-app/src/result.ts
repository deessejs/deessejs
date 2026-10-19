export type ResultMode = "create" | "dry-run"

export type ResultSource = {
  repo: "deessejs/saas-template"
  ref: "main"
  sha: string // absent only when failure happened before SHA resolution
}

export type ResultSourceMaybeSha = {
  repo: "deessejs/saas-template"
  ref: "main"
  sha: string | undefined
}

export type ResultPackageName = {
  previous: string
  current: string
}

export type ResultPackageManager = "pnpm"

/**
 * One entry from the validated tarball. The path is normalized
 * (post-strip, post-normalize) so a script that joins the
 * destination with `path` gets the same byte path the real
 * extraction would have written.
 */
export type PlannedEntry = {
  /** Normalized relative path inside the project (e.g. "src/index.ts"). */
  path: string
  /** Size in bytes from the tarball entry header. */
  size: number
  /** Entry mode, decimal (e.g. 0o644 = 420). */
  mode: number
}

export type InstallCommand = {
  bin: string
  args: string[]
}

export type DryRunPrereqs = {
  corepack: boolean
  npm: boolean
  pnpm: boolean
}

/**
 * The install section of a dry-run plan. `skipped: true` means
 * the dry-run was invoked with `--no-install`; the strategy,
 * command, and prereqs are absent in that case (the dry-run
 * does not probe or plan an install it would not run).
 */
export type DryRunInstall =
  | {
      skipped: false
      strategy: "corepack" | "npm-exec" | "pnpm-direct"
      command: InstallCommand
      prereqs: DryRunPrereqs
    }
  | { skipped: true }

export type CreateSuccess = {
  ok: true
  mode: ResultMode
  projectCreated: true
  installed: boolean
  source: ResultSource
  destination: string
  packageName: ResultPackageName
  packageManager: ResultPackageManager
  /** Null when installed successfully; otherwise the recovery command. */
  recovery: string | null
}

export type InstallOutput = {
  code: number
  stderr: string
  stdout: string
}

export type CreateInstallFailure = {
  ok: false
  mode: ResultMode
  projectCreated: true
  /** Always false in this variant. The contract requires it. */
  installed: false
  source: ResultSourceMaybeSha
  destination: string
  error: {
    code: "install_failed"
    message: string
    hint: string | undefined
  }
  /** Command the user can run to retry. */
  recovery: string
  /** Captured install output (already mirrored to stderr). */
  installOutput: InstallOutput
}

export type CreateDryRunResult = {
  ok: true
  mode: "dry-run"
  /** Always false: the dry-run does not create the destination. */
  projectCreated: false
  /** Always false: the dry-run does not run install. */
  installed: false
  source: ResultSource
  destination: string
  packageName: ResultPackageName
  packageManager: ResultPackageManager
  install: DryRunInstall
  plannedFiles: PlannedEntry[]
  documentation: string
  /** Always null: the dry-run did not attempt anything that could fail. */
  recovery: null
}

export type CreateFailure = {
  ok: false
  mode: ResultMode
  /** True iff the project files are on disk at `destination`. */
  projectCreated: boolean
  source?: ResultSourceMaybeSha
  destination?: string
  error: {
    code: string
    message: string
    hint: string | undefined
  }
  /** Present when installed is false and the project exists. */
  recovery?: string
}

export type CreateResult =
  | CreateSuccess
  | CreateInstallFailure
  | CreateDryRunResult
  | CreateFailure
