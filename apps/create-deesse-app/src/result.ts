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

export type CreateResult = CreateSuccess | CreateFailure