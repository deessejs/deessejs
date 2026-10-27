// Type declarations for the `cross-spawn` package.
//
// Why this file exists: cross-spawn@7.0.6 (the version we depend on) does
// not ship its own `.d.ts`, and `@types/cross-spawn` is not on the public
// registry. Until upstream adds types, we declare just enough surface for
// the one caller in this package: src/install/run.ts. Keep this
// declaration minimal — if a new caller needs more fields, add them here
// rather than at the call site so the boundary stays narrow.
declare module "cross-spawn" {
  import { ChildProcess, StdioOptions } from "node:child_process"
  export type SpawnOptions = {
    cwd?: string
    env?: NodeJS.ProcessEnv
    stdio?: StdioOptions
    shell?: boolean
    windowsHide?: boolean
  }
  export function spawn(
    command: string,
    args: readonly string[],
    options?: SpawnOptions
  ): ChildProcess
  const _default: typeof spawn
  export default _default
}
