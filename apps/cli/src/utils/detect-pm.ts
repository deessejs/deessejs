import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun"

export type PackageManagerInfo = {
  pm: PackageManager
  /** Raw value from packageManager field, e.g. "pnpm@9.0.0". May include version. */
  raw?: string
}

/**
 * Detect the package manager for a directory, in priority order:
 *   1. `packageManager` field in package.json (Corepack convention)
 *   2. Lockfile presence
 *   3. Returns null if nothing matches (caller decides whether to fail)
 */
export const detectPackageManager = (
  cwd: string,
): PackageManagerInfo | null => {
  const pkg = readPackageJson(cwd)
  if (pkg?.packageManager) {
    const pm = parsePackageManagerField(pkg.packageManager)
    if (pm) return pm
  }

  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return { pm: "pnpm" }
  if (existsSync(join(cwd, "bun.lockb"))) return { pm: "bun" }
  if (existsSync(join(cwd, "yarn.lock"))) return { pm: "yarn" }
  if (existsSync(join(cwd, "package-lock.json"))) return { pm: "npm" }

  return null
}

export const getInstallCommand = (info: PackageManagerInfo): string => {
  switch (info.pm) {
    case "pnpm":
      return "pnpm install"
    case "npm":
      return "npm install"
    case "yarn":
      return "yarn install"
    case "bun":
      return "bun install"
  }
}

const readPackageJson = (
  cwd: string,
): { packageManager?: string } | null => {
  const path = join(cwd, "package.json")
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, "utf8")) as {
      packageManager?: string
    }
  } catch {
    return null
  }
}

const parsePackageManagerField = (
  raw: string,
): PackageManagerInfo | null => {
  // Format: "<name>@<version>" or just "<name>". Common names: pnpm, npm, yarn, bun.
  const name = raw.split("@")[0]?.trim().toLowerCase()
  if (name === "pnpm" || name === "npm" || name === "yarn" || name === "bun") {
    return { pm: name, raw }
  }
  return null
}