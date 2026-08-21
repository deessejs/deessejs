import { API_BASE_PATH } from "@workspace/api/base-path"

import { readPackageVersion } from "../api/self-version.js"

export type CliVersionResponse = {
  version: string
  minSupported: string
}

const SEMVER_RE = /^\d+\.\d+\.\d+$/

const parseSemver = (v: string): [number, number, number] | null => {
  if (!SEMVER_RE.test(v)) return null
  const [major, minor, patch] = v.split(".").map(Number)
  return [major ?? 0, minor ?? 0, patch ?? 0]
}

const compareSemver = (a: string, b: string): number => {
  const pa = parseSemver(a)
  const pb = parseSemver(b)
  if (!pa || !pb) return 0 // unknown: don't warn
  if (pa[0] !== pb[0]) return pa[0] - pb[0]
  if (pa[1] !== pb[1]) return pa[1] - pb[1]
  return pa[2] - pb[2]
}

/**
 * Non-blocking version probe.
 *
 * Calls `${API_BASE_PATH}/version` (a system route per ADR-011, served
 * by Hono direct, not through oRPC). If the local CLI version is
 * strictly below minSupported, prints a warning to stderr. The caller
 * does NOT abort; the user might have a workflow that depends on the
 * old version. The warning is loud but not authoritative.
 *
 * Failures (network, parse, server error) are swallowed silently: the
 * version check is best-effort, never the reason a command fails.
 */
export const maybeWarnAboutOutdatedCli = async (): Promise<void> => {
  let bodyText: string
  try {
    // Per ADR-021: the version probe URL is composed from the path
    // constant and the host constant. The previous form
    // `${API_BASE_PATH}/version` (a relative path) resolved
    // against the user's working directory and crashed the
    // version probe. The host defaults to https://app.deessejs.com
    // (the real backend domain); users override via the
    // `API_BASE_URL` shell env var.
    const apiBaseUrl =
      process.env.API_BASE_URL?.replace(/\/$/, "") ??
      "https://app.deessejs.com"
    const versionUrl = new URL(
      `${API_BASE_PATH}/version`,
      apiBaseUrl,
    ).toString()
    const res = await fetch(versionUrl)
    if (res.status !== 200) return
    bodyText = await res.text()
  } catch {
    return
  }

  let parsed: CliVersionResponse
  try {
    parsed = JSON.parse(bodyText) as CliVersionResponse
  } catch {
    return
  }
  if (
    typeof parsed.version !== "string" ||
    typeof parsed.minSupported !== "string"
  ) {
    return
  }

  const localVersion = readPackageVersion()
  if (compareSemver(localVersion, parsed.minSupported) < 0) {
    process.stderr.write(
      `\n⚠ deessejs-cli ${localVersion} is below the minimum supported version (${parsed.minSupported}).\n` +
        `  Upgrade: pnpm dlx @deessejs/cli@latest\n\n`,
    )
  }
}
