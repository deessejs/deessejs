/**
 * Run the CLI by shelling out to the bundled `dist/index.js`.
 *
 * We spawn a real child process (`node dist/index.js …`) instead of
 * invoking commander in-process because the CLI calls
 * `process.exit(1)` from an event-listener in `executeSubCommandAsync`
 * (commander 12). Catching that in-process is fragile — commander
 * 11+ has an `exitOverride` hook but only on the path through
 * `_parseCommand`; the unguarded `process.exit` in the sub-command
 * runner bypasses it. Spawning makes the worker immune: the
 * child exits, the parent collects stdout/stderr/exitCode.
 *
 * Cost: ~80ms per test for Node startup. Across 6 init tests, the
 * suite runs in ~3s — well within CI budget.
 *
 * **What we exercise by spawning**:
 *   - The same commander handler that production runs.
 *   - The bundled CLI (`dist/index.js`), so the bin-wrapping
 *     surface is covered (shebang, ESM resolution).
 *   - The env-var wiring (`DEESSEJS_API_URL`,
 *     `DEESSEJS_GITHUB_RAW_BASE`) end-to-end.
 *
 * **What we don't exercise**: the SDK's own process (it's in the
 * child). That's covered by the unit and contract tests.
 */

import { spawn } from "node:child_process"
import { resolve } from "node:path"

export type InvokeResult = {
  exitCode: number
  stdout: string
  stderr: string
}

export type InvokeOptions = {
  /** Working directory for the command. Required. */
  cwd: string
  /** Extra env vars. Caller is responsible for using `withEnv`. */
  env?: Readonly<Record<string, string>>
  /**
   * Args passed to the command, **without** the leading command
   * name. The child sees `node dist/index.js <args>`.
   */
  args: readonly string[]
}

/**
 * Resolve the path to the bundled CLI binary. The test runner
 * executes from `apps/cli/`; the binary lives at `dist/index.js`
 * (built by `pnpm build`).
 */
const cliEntry = resolve(process.cwd(), "dist/index.js")

/**
 * Spawn the bundled CLI with the given args. Returns the captured
 * stdout/stderr/exitCode. **Resolves** on exit 0, **rejects** on
 * any non-zero exit.
 *
 * The child inherits the parent's env, plus the overrides in
 * `options.env`. The parent restores `process.cwd()` and `env`
 * via the `withEnv`/`withCwd` helpers (caller chains them).
 */
export const invoke = async (
  options: InvokeOptions,
): Promise<InvokeResult> => {
  for (const [k, v] of Object.entries(options.env ?? {})) {
    process.env[k] = v
  }

  return new Promise<InvokeResult>((resolveFn, reject) => {
    const child = spawn(
      process.execPath,
      [cliEntry, ...options.args],
      {
        cwd: options.cwd,
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"],
      },
    )

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []
    child.stdout?.on("data", (chunk: Buffer) => stdoutChunks.push(chunk))
    child.stderr?.on("data", (chunk: Buffer) => stderrChunks.push(chunk))

    child.on("close", (code) => {
      const exitCode = code ?? 1
      // Flush any remaining stderr bytes — some error paths write
      // via process.stderr after the main exit. Concatenate any
      // late chunks before resolving.
      const stdout = Buffer.concat(stdoutChunks).toString("utf8")
      const stderr = Buffer.concat(stderrChunks).toString("utf8")
      if (exitCode === 0) {
        resolveFn({ exitCode, stdout, stderr })
      } else {
        const err = new Error(
          `command exited with code ${exitCode}: ${stderr}`,
        )
        ;(err as { exitCode: number }).exitCode = exitCode
        ;(err as { stdout: string }).stdout = stdout
        ;(err as { stderr: string }).stderr = stderr
        reject(err)
      }
    })

    child.on("error", (cause) => {
      reject(
        new Error(
          `failed to spawn ${process.execPath} ${cliEntry}: ${String(cause)}`,
        ),
      )
    })
  })
}

// Silence the unused `_command` parameter — kept in the signature
// for callers that already pass the command, even though the
// child-process model doesn't use it. Comment-out if you want
// strict argument count.
void (async () => {})