import { spawnSync, type SpawnSyncOptions } from "node:child_process"

/**
 * The result of probing a single binary's presence on the
 * consumer's PATH. We only care about `status` for the
 * decision; `output` and `signal` are kept for debugging.
 * The `output` shape is intentionally loose: the underlying
 * `spawnSync` types depend on the `stdio` option and the
 * Node version's buffer types, and we do not consume the
 * output here. Tests may pass any compatible value.
 */
export type SyncRunnerResult = {
  status: number | null
  output: unknown
  signal: NodeJS.Signals | null
}

/**
 * The shape of the runner function. It receives the binary
 * name (typically `which` or `where`) and a one-element
 * argument vector (the candidate bin name), and returns a
 * `spawnSync`-shaped result.
 *
 * The runner does **not** receive an `env` parameter. The
 * default runner relies on `process.env.PATH` to resolve each
 * binary (which is the standard `PATH` lookup behavior the user
 * expects), and a stubbed runner in tests can choose to read
 * the test's PATH or return a fixed `{ status: 0, ... }` without
 * consulting the env.
 */
export type SyncRunner = (
  command: string,
  args: readonly string[],
) => SyncRunnerResult

const defaultRunner: SyncRunner = (command, args) => {
  const r = spawnSync(command, args, {
    stdio: "ignore",
    timeout: 5_000,
  } satisfies SpawnSyncOptions)
  return {
    status: r.status,
    output: r.output,
    signal: r.signal,
  }
}

export type InstallPrereqs = {
  corepack: boolean
  npm: boolean
  pnpm: boolean
}

const probe = (
  bin: string,
  runner: SyncRunner,
): boolean => {
  const which = process.platform === "win32" ? "where" : "which"
  const r = runner(which, [bin])
  return r.status === 0
}

/**
 * Probe the consumer's PATH for the three binaries the install
 * bootstrap may need. Returns the booleans `pickInstallStrategy`
 * consumes. The function never throws: a missing binary,
 * timeout, or non-zero exit returns `false` for the
 * corresponding flag.
 *
 * The default runner is platform-aware: `which` on POSIX,
 * `where` on Windows. Tests inject a stubbed runner.
 */
export const probeInstallPrereqs = (
  runner: SyncRunner = defaultRunner,
): InstallPrereqs => ({
  corepack: probe("corepack", runner),
  npm: probe("npm", runner),
  pnpm: probe("pnpm", runner),
})
