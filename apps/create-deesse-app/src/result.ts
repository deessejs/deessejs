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
      // The install command is the same `InstallCommand`
      // shape the live-create path uses. We re-declare the
      // shape here (rather than importing from pm/manager)
      // to keep `result.ts` free of implementation-side
      // imports: the JSON contract is the public surface,
      // and result.ts should not pull in a package manager
      // detail to describe a discriminated plan.
      command: { bin: string; args: string[] }
      prereqs: DryRunPrereqs
    }
  | { skipped: true }

// Each `mode`-bearing variant declares its `mode` field as
// a string literal, not as the `ResultMode` union, so the
// discriminant narrows cleanly: a script that switches on
// `result.mode === "dry-run"` can rely on TypeScript
// rejecting access to `install`, `plannedFiles`, etc.
// on `CreateSuccess`, and rejecting access to `installed`,
// `recovery`, etc. on `CreateDryRunResult`. The closed
// `ResultMode` union is the type of any value that *might*
// be one of the literals; the literals themselves are the
// discriminants that make the union useful.
export type CreateSuccess = {
  ok: true
  mode: "create"
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
  mode: "create"
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
  // Failures carry the mode the user asked for, not a
  // string literal: a `CreateFailure` can come from either
  // the create path or the dry-run path. The pipeline
  // sets the literal value at the throw site (see
  // `pipeline.ts`'s catch arm). Scripts narrow on `ok`
  // first, then on `error.code`, then read `mode` as
  // informational.
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
