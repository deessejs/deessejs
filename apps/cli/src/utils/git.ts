import { spawn } from "./spawn.js"
import { gitNotInstalled } from "../errors.js"

export type CloneResult = {
  ref: string
  attempts: string[]
}

/**
 * Clone a git repo to `dir`. Tries `main` first, then falls back to `master`.
 * Caller can pass an explicit `--ref` to override.
 */
export const cloneRepo = async (
  url: string,
  dir: string,
  requestedRef?: string,
): Promise<CloneResult> => {
  const refs = requestedRef ? [requestedRef] : ["main", "master"]
  const attempts: string[] = []

  for (const ref of refs) {
    attempts.push(ref)
    const code = await spawn(
      "git",
      ["clone", "--depth", "1", "--branch", ref, url, dir],
      { stdio: "inherit", reject: false },
    )
    if (code === 0) {
      return { ref, attempts }
    }
  }

  // All attempts failed. Probe whether git is even installed.
  const probe = await spawn("git", ["--version"], {
    stdio: "ignore",
    reject: false,
  })
  if (probe !== 0) {
    throw gitNotInstalled()
  }

  // Git works but neither ref matched. Re-throw with attempts context.
  throw new Error(
    `git clone failed for refs: ${refs.join(", ")}. Tried: ${attempts.join(", ")}.`,
  )
}