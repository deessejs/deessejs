import type { InstallStrategy } from "./install-strategy.js"

// Closed enum for #225 (pnpm-only). #226 keeps pnpm as the only
// install target; npm/yarn/bun refer to invokers, not installs.
export type PackageManagerId = "pnpm"

export type InstallCommand = {
  bin: string
  args: string[]
}

export type PackageManager = {
  readonly id: PackageManagerId
  /**
   * The install command for the given strategy and version. The
   * factory is pure: it takes the strategy the runtime chose and
   * the pnpm version to use, and returns a `bin` + `args` pair
   * ready for `spawn`.
   */
  installCommand(strategy: InstallStrategy, version: string): InstallCommand
  readonly lockfileName: string
  /**
   * `requiresCorepack` today means "the install command needs
   * corepack on PATH to run." With the three-way install
   * command factory, that is no longer true: the install command
   * can be `corepack pnpm install`, `npm exec --yes --
   * pnpm@<version> install`, or `pnpm install`. Only the first
   * path needs corepack. The flag is informational; the install
   * strategy is decided at runtime by `pickInstallStrategy`,
   * which the run-install path consumes. Corepack is a hint,
   * not a hard dependency.
   */
  readonly requiresCorepack: boolean
}
