declare module "cross-spawn" {
  import { ChildProcess, StdioOptions } from "node:child_process"
  export interface SpawnOptions {
    cwd?: string
    env?: NodeJS.ProcessEnv
    stdio?: StdioOptions
    shell?: boolean
    windowsHide?: boolean
  }
  export function spawn(
    command: string,
    args: readonly string[],
    options?: SpawnOptions,
  ): ChildProcess
  const _default: typeof spawn
  export default _default
}