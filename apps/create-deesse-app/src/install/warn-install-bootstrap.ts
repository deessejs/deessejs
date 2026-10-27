import pc from "picocolors"

import type { InstallStrategy } from "../pm/install-strategy.js"

const dim = (s: string): string =>
  pc.isColorSupported ? `\x1b[2m${s}\x1b[22m` : s

const PREFIX = "create-deesse-app:"

/**
 * Emit a single stderr line announcing the install bootstrap
 * the runtime chose.
 *
 *  - In a real create, the line is the historical
 *    "installing dependencies via corepack" message. The
 *    user is about to see `pnpm install` run; the message
 *    matches what they see.
 *  - In a dry-run, the line announces the path the
 *    install *would use*, not an install that is about to
 *    start. The wording shifts to "would use" / "would
 *    fall back to" so a user who reads the line in their
 *    terminal is not surprised when no install runs.
 *
 * The function does **not** probe anything; it only
 * describes the choice `pickInstallStrategy` already made.
 * The npm-exec text says "may be downloaded" because
 * `pnpm@<version>` may already be in npm's cache from a
 * previous run. The pnpm-direct text does not claim the
 * version matches the project, because the function cannot
 * know that.
 *
 * The `writer` parameter is injectable so the unit test can
 * capture the line without redirecting `process.stderr`.
 */
export const warnInstallBootstrap = (
  bootstrap: InstallStrategy,
  mode: "create" | "dry-run" = "create",
  writer: (s: string) => void = process.stderr.write.bind(process.stderr)
): void => {
  let line: string
  if (mode === "dry-run") {
    switch (bootstrap) {
      case "corepack":
        line = `${PREFIX} dry-run: install would use corepack (uses the generated project's packageManager field)`
        break
      case "npm-exec":
        line = `${PREFIX} dry-run: corepack not on PATH; install would fall back to npm (would download pnpm@<v> into npm's cache, no global install)`
        break
      case "pnpm-direct":
        line = `${PREFIX} dry-run: corepack and npm not on PATH; install would use pnpm from PATH (version is not guaranteed to match the project)`
        break
    }
  } else {
    switch (bootstrap) {
      case "corepack":
        line = `${PREFIX} installing dependencies via corepack (uses the generated project's packageManager field)`
        break
      case "npm-exec":
        line = `${PREFIX} corepack not found; running pnpm through npm (may be downloaded into npm's cache, no global install)`
        break
      case "pnpm-direct":
        line = `${PREFIX} corepack and npm not found on PATH; using pnpm from PATH (version is not guaranteed to match the project)`
        break
    }
  }
  writer(`${dim(PREFIX)}${line.slice(PREFIX.length)}\n`)
}
