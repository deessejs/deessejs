import pc from "picocolors"

import type { InstallStrategy } from "../pm/install-strategy.js"

const dim = (s: string): string => (pc.isColorSupported ? `[2m${s}[22m` : s)

const PREFIX = "create-deesse-app:"

/**
 * Emit a single stderr line announcing the install bootstrap
 * the runtime chose. The function does **not** probe anything;
 * it only describes the choice `pickInstallStrategy` already
 * made. The npm-exec text says "may be downloaded" because
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
  writer: (s: string) => void = process.stderr.write.bind(process.stderr),
): void => {
  let line: string
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
  writer(`${dim(PREFIX)}${line.slice(PREFIX.length)}\n`)
}
