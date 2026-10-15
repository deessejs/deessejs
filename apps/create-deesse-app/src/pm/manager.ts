// Closed enum for #225 (pnpm-only). #226 adds "npm".
export type PackageManagerId = "pnpm"

export interface InstallCommand {
  bin: string
  args: string[]
}

export interface PackageManager {
  readonly id: PackageManagerId
  installCommand(): InstallCommand
  readonly lockfileName: string
  /** True when no Corepack shim is needed; false when consumers must enable Corepack. */
  readonly requiresCorepack: boolean
}