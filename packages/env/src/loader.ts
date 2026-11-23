import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import process from "node:process"

import * as dotenv from "dotenv"

/**
 * Snapshot returned by `loadDotenvSnapshot`. A plain object literal whose
 * keys mirror the names defined in `schema.ts`. Values are strings, the
 * empty string (after `parse()` it would have been `undefined` had
 * `emptyStringAsUndefined` been applied at parse time; here we keep the
 * raw string and let `createEnv`'s `emptyStringAsUndefined: true` flag
 * convert it).
 *
 * No side-effects on `process.env`. The snapshot is the contract.
 */
export type EnvSnapshot = Record<string, string | undefined>

/**
 * Single-process guard. Two reasons it lives here:
 *
 * 1. `loadDotenvSnapshot` reads the file system. We do not want to hit it
 *    on every call. The guard makes the function memoised.
 * 2. `loadRepoEnv` mutates `process.env`. Doing it once is the rule.
 */
let cachedSnapshot: EnvSnapshot | null = null
let loaded = false

/**
 * Find the monorepo root (the directory containing `pnpm-workspace.yaml`).
 * Walks up from `start` until it finds the marker. Works whether called
 * from `packages/*`, `apps/*`, `scripts/`, or the root itself.
 */
function findRepoRoot(start: string): string {
  let dir = path.resolve(start)
  const { root } = path.parse(dir)
  while (dir !== root) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir
    dir = path.dirname(dir)
  }
  return start
}

/**
 * Read the `.env` hierarchy in Next.js precedence and return a plain
 * object snapshot.
 *
 * Precedence (first wins), per the Next.js 16 docs:
 *
 *   1. `process.env` itself (already set by the host shell / CI)
 *   2. `.env.{NODE_ENV}.local`  (skipped when NODE_ENV=test)
 *   3. `.env.local`              (skipped when NODE_ENV=test)
 *   4. `.env.{NODE_ENV}`
 *   5. `.env`
 *
 * `.env.local` is intentionally skipped when `NODE_ENV=test`: tests must
 * produce the same result for every contributor. This mirrors the Next.js
 * docs verbatim.
 *
 * The function does NOT mutate `process.env`. The returned object is the
 * source of truth for `createEnv`'s `runtimeEnv` argument.
 */
export function loadDotenvSnapshot(
  repoRoot: string = findRepoRoot(process.cwd())
): EnvSnapshot {
  if (cachedSnapshot) return cachedSnapshot

  cachedSnapshot = loadDotenvSnapshotFrom(repoRoot, process.env)
  return cachedSnapshot
}

/**
 * Build an environment snapshot without mutating process.env. The local
 * agent launcher passes the complete allowed worktree environment, so its
 * child processes must not fill unset values from root dotenv files.
 */
export function loadDotenvSnapshotFrom(
  repoRoot: string,
  processEnvironment: NodeJS.ProcessEnv
): EnvSnapshot {
  const snapshot: EnvSnapshot = { ...processEnvironment }
  if (processEnvironment.DEV_AGENT_LOCAL_RUNTIME === "true") {
    return snapshot
  }

  const nodeEnv = processEnvironment.NODE_ENV ?? "development"
  const isTest = nodeEnv === "test"

  const filenames: string[] = []
  if (!isTest) {
    filenames.push(`.env.${nodeEnv}.local`)
    filenames.push(`.env.local`)
  }
  filenames.push(`.env.${nodeEnv}`)
  filenames.push(`.env`)

  // Files are read in ascending precedence order: later files override
  // earlier ones. `dotenv.parse` does NOT mutate any external state.
  for (const filename of filenames) {
    const filepath = path.join(repoRoot, filename)
    if (!existsSync(filepath)) continue
    const parsed = dotenv.parse(readFileSync(filepath))
    for (const [key, value] of Object.entries(parsed)) {
      if (snapshot[key] === undefined) snapshot[key] = value
    }
  }

  return snapshot
}

/**
 * Legacy shim. Calls `loadDotenvSnapshot()` and mirrors the result into
 * `process.env` for callers that still read `process.env` directly
 * (`drizzle.config.ts`, scripts).
 *
 * Idempotent. The mutation happens once per process.
 *
 * New code should call `loadDotenvSnapshot()` directly and pass the
 * returned object to `createEnv` as `runtimeEnv`. The shim is here only
 * to keep the legacy consumers working without a coordinated refactor
 * across the monorepo.
 */
export function loadRepoEnv(): void {
  if (loaded) return
  const snapshot = loadDotenvSnapshot()
  for (const [key, value] of Object.entries(snapshot)) {
    if (value !== undefined) {
      process.env[key] = value
    }
  }
  loaded = true
}
