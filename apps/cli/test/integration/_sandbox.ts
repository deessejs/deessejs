/**
 * Per-test scratch directory for integration tests.
 *
 * The CLI talks to the filesystem (mkdir for `init`, writeFile for
 * registry caches, ~\.deessejs/auth.json during `auth login`).
 * Tests need a clean root for every run so they don't trip on
 * each other's state. We use `mkdtempSync(os.tmpdir(), prefix)`
 * which guarantees uniqueness and an atomic creation — no race
 * between parallel vitest workers.
 *
 * Why one helper, not `beforeEach` boilerplate in every test:
 * the auth tests already encode the same pattern inline (see
 * `apps/cli/test/integration/auth/login.test.ts`). Lifting it
 * to a shared module makes the next integration test free.
 */

import { mkdirSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

/** Make a unique tmpdir under `os.tmpdir()/<prefix>-<pid>-<ts>`. */
export const makeSandbox = (prefix: string): string => {
  const base = mkdtempSync(
    join(tmpdir(), `deessejs-${prefix}-${process.pid}-`),
  )
  mkdirSync(base, { recursive: true })
  return base
}

/** Recursively remove a sandbox created by `makeSandbox`. */
export const cleanupSandbox = (path: string): void => {
  rmSync(path, { recursive: true, force: true })
}

/**
 * Override `HOME` (and `USERPROFILE` on Windows) for the duration
 * of `fn`, restoring the previous values when it returns or throws.
 *
 * The CLI uses `~/.deessejs/` for auth state and cached descriptors.
 * Redirecting `HOME` to a tmpdir keeps those side effects inside
 * the sandbox; without this override, tests would clobber the
 * developer's local state on a successful `auth login`.
 */
export const withHome = <T>(home: string, fn: () => T | Promise<T>): Promise<T> => {
  const realHome = process.env["HOME"]
  const realProfile = process.env["USERPROFILE"]
  process.env["HOME"] = home
  process.env["USERPROFILE"] = home
  try {
    return Promise.resolve(fn())
  } finally {
    if (realHome === undefined) delete process.env["HOME"]
    else process.env["HOME"] = realHome
    if (realProfile === undefined) delete process.env["USERPROFILE"]
    else process.env["USERPROFILE"] = realProfile
  }
}

/** Run `fn` with `process.cwd()` set to `cwd`, restored on exit. */
export const withCwd = <T>(cwd: string, fn: () => T | Promise<T>): Promise<T> => {
  const realCwd = process.cwd()
  process.chdir(cwd)
  try {
    return Promise.resolve(fn())
  } finally {
    process.chdir(realCwd)
  }
}

/**
 * Set one or more env vars for the duration of `fn`. Restored on
 * exit even if `fn` throws. Use for `DEESSEJS_API_URL`,
 * `DEESSEJS_GITHUB_RAW_BASE`, and any other override the CLI or
 * SDK reads from the environment.
 */
export const withEnv = async <T>(
  vars: Readonly<Record<string, string>>,
  fn: () => T | Promise<T>,
): Promise<T> => {
  const previous: Record<string, string | undefined> = {}
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key]
    process.env[key] = vars[key]
  }
  try {
    return await fn()
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}