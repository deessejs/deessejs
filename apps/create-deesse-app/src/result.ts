export type ResultMode = "create"

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

export type CreateResult = CreateSuccess | CreateInstallFailure | CreateFailure
