import { existsSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"

// `@next/env` ships as CJS. Use createRequire for a reliable interop path
// that works from both ESM consumers and the generated CJS output, without
// relying on TypeScript's esModuleInterop shenanigans.
const require = createRequire(import.meta.url)
const { loadEnvConfig } = require("@next/env") as {
  loadEnvConfig: (
    projectDir: string,
    dev?: boolean,
    log?: unknown,
    forceReload?: boolean,
  ) => { combinedEnv: Record<string, string | undefined>; loadedEnvFiles: unknown[] }
}

/**
 * Single-process guard.
 */
let loaded = false

/**
 * Loads the repo-root .env files into process.env. Safe to call multiple times.
 *
 * - In Next.js apps, Next already calls `loadEnvConfig` at startup; this is a
 *   no-op equivalent.
 * - In drizzle-kit / better-auth CLI scripts, this is the only loader.
 * - In vitest, this runs once per process via the `setupFiles` entry.
 *
 * Precedence matches Next.js: `.env.local` > `.env.{NODE_ENV}` > `.env`.
 *
 * **@next/env cache bug (fixed in @next/env@16.2.11+, workaround here):**
 * `loadEnvConfig` caches results per-process, but the cache key does NOT
 * include the `dir` argument. In monorepos, Next.js calls `loadEnvConfig`
 * internally with `apps/app/` first (no .env there → empty result). When
 * this function then calls `loadEnvConfig(repoRoot)`, it hits the stale cache
 * and silently returns an empty result — .env at the root is ignored.
 * See: https://github.com/vercel/next.js/issues/92040
 *
 * Workaround: pass `forceReload: true` (4th arg) to bypass the cache.
 * Additionally, we explicitly merge `combinedEnv` into `process.env` as a
 * safety net, since `loadEnvConfig` should do this but the cache bug can
 * prevent it in edge cases.
 */
export function loadRepoEnv(): void {
  if (loaded) return

  // Walk up to the repo root (the dir that contains pnpm-workspace.yaml).
  // Works whether called from packages/*, apps/*, scripts/, or the root.
  const projectDir = process.cwd()
  const repoRoot = findRepoRoot(projectDir)

  // forceReload=true bypasses the @next/env cache bug (#92040) where the cache
  // ignores the directory argument and returns a stale empty result from the
  // app-level call that ran before this function.
  const result = loadEnvConfig(repoRoot, false, console, true)

  // Explicitly merge so that even if the cache bug somehow still applies,
  // process.env always has the values we need.
  for (const [key, value] of Object.entries(result.combinedEnv)) {
    if (value !== undefined) {
      process.env[key] = value
    }
  }

  loaded = true
}

function findRepoRoot(start: string): string {
  let dir = path.resolve(start)
  const { root } = path.parse(dir)
  while (dir !== root) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir
    dir = path.dirname(dir)
  }
  return start
}
