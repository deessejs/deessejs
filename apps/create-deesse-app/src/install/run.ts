import * as crossSpawn from "cross-spawn"

import { installFailed } from "../errors/index.js"
import type { PackageManager } from "../pm/manager.js"

export type RunInstallResult =
  | { ok: true }
  | { ok: false; code: number; stderr: string; stdout: string }

export type RunInstallArgs = {
  manager: PackageManager
  cwd: string
}

/**
 * Run the package manager's install command in `cwd`. Captures stdout and
 * stderr separately so install log noise never leaks into our JSON-on-stdout
 * contract. Never throws on non-zero exit — returns `{ ok: false, code,
 * stderr, stdout }` so the caller can decide whether to throw or to retain
 * the project with a recovery command.
 *
 * On non-zero, also throws `installFailed` so the caller's error path
 * surfaces the correct code (`install_failed`) in the JSON result. The
 * result of `runInstall` and the throw are paired: the caller catches the
 * throw, then prints its JSON with `projectCreated: true` + `recovery`.
 */
export const runInstall = async (args: RunInstallArgs): Promise<RunInstallResult> => {
  const { manager, cwd } = args
  const cmd = manager.installCommand()

  return new Promise<RunInstallResult>((resolve, rejectFn) => {
    const child = crossSpawn.spawn(cmd.bin, cmd.args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    })

    let stdout = ""
    let stderr = ""

    child.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += typeof chunk === "string" ? chunk : chunk.toString("utf8")
    })
    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += typeof chunk === "string" ? chunk : chunk.toString("utf8")
    })

    child.on("error", () => {
      // ENOENT etc. — the binary isn't installed. Treat as install failure.
      rejectFn(installFailed(manager.id, null))
    })
    child.on("exit", (code) => {
      const exit = code ?? 1
      if (exit === 0) {
        resolve({ ok: true })
      } else {
        resolve({ ok: false, code: exit, stderr, stdout })
      }
    })
  })
}