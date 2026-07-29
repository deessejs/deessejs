#!/usr/bin/env node
/**
 * Bootstrap helper for shell-invoked tools (drizzle-kit, better-auth CLI).
 *
 * Usage:
 *   node scripts/with-env.mjs <cmd> [args...]
 *
 * Loads the repo-root .env files (same precedence as Next.js) and then
 * spawns the given command with the loaded env. The spawned process
 * inherits stdio, so output and exit codes pass through.
 *
 * On Windows, `shell: true` is required so `.cmd` shims (e.g. pnpm's
 * node_modules/.bin/drizzle-kit.cmd) resolve correctly under Git Bash.
 *
 * Implementation note: this script lives outside any workspace package
 * (under scripts/), so it cannot `import "@next/env"` directly (pnpm does
 * not hoist to the root). Instead, it imports the compiled
 * `@workspace/env` loader from `packages/env/dist/`, which has the
 * correct resolution context for its transitive deps.
 */

import { spawn } from "node:child_process"
import { fileURLToPath, pathToFileURL } from "node:url"
import path from "node:path"

const loaderPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../packages/env/dist/loader.js",
)
const { loadRepoEnv } = await import(pathToFileURL(loaderPath).href)

loadRepoEnv()

// Strip the conventional `--` separator so callers can write
// `node scripts/with-env.mjs -- pnpm exec ...` and we don't try to spawn
// `--` as a command.
const argv = process.argv.slice(2)
const [cmd, ...args] = argv[0] === "--" ? argv.slice(1) : argv
if (!cmd) {
  console.error("usage: node scripts/with-env.mjs [--] <cmd> [args...]")
  process.exit(2)
}

const child = spawn(cmd, args, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
})

child.on("exit", (code) => process.exit(code ?? 1))
child.on("error", (err) => {
  console.error(`[with-env] failed to spawn: ${err.message}`)
  process.exit(1)
})
