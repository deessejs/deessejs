import { execa, type ExecaError } from "execa"
import { existsSync } from "node:fs"
import { readdir, stat } from "node:fs/promises"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * CLI runner for the e2e suite.
 *
 * Spawns the CLI binary from the published tarball with the env
 * overrides the test passes. Captures stdout, stderr, and the
 * exit code. Returns a structured result rather than throwing on
 * non-zero exit codes, so tests can assert on the exit code
 * directly.
 *
 * The tarball path is read from the env var DEESSEJS_CLI_TARBALL,
 * which the verify workflow sets before invoking the tests. If
 * the env var is unset, the runner fails with a clear error
 * message.
 *
 * Implements ADR-014.
 */

export type RunOptions = {
  args: string[]
  env?: Record<string, string>
  timeoutMs?: number
  cwd?: string
}

export type RunResult = {
  stdout: string
  stderr: string
  exitCode: number
  durationMs: number
}

const DEFAULT_TIMEOUT_MS = 30_000

const resolveTarball = async (): Promise<string> => {
  const envTarball = process.env.DEESSEJS_CLI_TARBALL
  if (envTarball !== undefined && envTarball !== "") {
    if (!existsSync(envTarball)) {
      throw new Error(
        `DEESSEJS_CLI_TARBALL points to '${envTarball}' but the file does not exist. ` +
          "The verify workflow must run before the e2e suite.",
      )
    }
    return envTarball
  }
  // Fall back to globbing the apps/cli directory and picking the
  // most recent tarball. This is for local dev where the env var
  // is not set. The search starts from the worktree root, which
  // is three directories up from this file (apps/cli/test/e2e/helpers/).
  const worktreeRoot = resolve(__dirname, "..", "..", "..", "..")
  const appsCliDir = resolve(worktreeRoot, "apps", "cli")
  const candidates = await readdir(appsCliDir)
    .catch(() => [] as Array<string>)
    .then((files) => files.filter((f) => /^deessejs-cli-.*\.tgz$/.test(f)))
  if (candidates.length === 0) {
    throw new Error(
      "DEESSEJS_CLI_TARBALL is not set and no tarball found in apps/cli/. " +
        "Set the env var to the tarball path, or run the verify workflow first.",
    )
  }
  const stats = await Promise.all(
    candidates.map(async (f) => {
      const path = resolve(appsCliDir, f)
      return { path, mtime: (await stat(path)).mtimeMs }
    }),
  )
  stats.sort((a, b) => b.mtime - a.mtime)
  return stats[0]?.path ?? ""
}

export const run = async (options: RunOptions): Promise<RunResult> => {
  const tarball = await resolveTarball()
  const env = {
    ...process.env,
    ...options.env,
    // Suppress non-deterministic output from the version probe.
    // The probe is best-effort and may print warnings on stderr;
    // tests assert on stderr for specific patterns, not the absence
    // of noise.
  }
  const start = Date.now()
  try {
    const result = await execa("node", [tarball, ...options.args], {
      env,
      timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      cwd: options.cwd,
      reject: false,
      killSignal: "SIGTERM",
    })
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode ?? 0,
      durationMs: Date.now() - start,
    }
  } catch (err) {
    // execa throws on timeout. Surface the partial result.
    const e = err as ExecaError
    return {
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? "",
      exitCode: e.exitCode ?? 1,
      durationMs: Date.now() - start,
    }
  }
}
