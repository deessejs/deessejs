import { realpathSync } from "node:fs"
import { dirname, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"
import * as crossSpawn from "cross-spawn"
import { Command } from "commander"
import pc from "picocolors"
import { readPackageVersion } from "../api/self-version.js"
import { printJson } from "../output/index.js"
import { spawnResult } from "../utils/spawn.js"

const PACKAGE_NAME = "@deessejs/cli"
const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)))

type Install = { manager: "npm" | "pnpm"; globalRoot: string; ephemeral: false } | { manager: "npx" | "pnpm dlx"; ephemeral: true } | { manager: null; ephemeral: false }

export const detectCliInstall = async (): Promise<Install> => {
  const agent = process.env.npm_config_user_agent ?? ""
  const entry = process.argv[1] ?? ""
  if (/npm\//i.test(agent) && /_npx|npm-cache/i.test(entry)) return { manager: "npx", ephemeral: true }
  if (/pnpm\//i.test(agent) && /dlx|_tmp/i.test(entry)) return { manager: "pnpm dlx", ephemeral: true }

  let runningRoot: string
  try { runningRoot = realpathSync(packageRoot) } catch { return { manager: null, ephemeral: false } }
  for (const manager of ["npm", "pnpm"] as const) {
    const command = manager
    const result = await capture(command, ["root", "-g"])
    if (result.code !== 0 || !result.stdout.trim()) continue
    const globalRoot = result.stdout.trim()
    let root: string
    try { root = realpathSync(globalRoot) } catch { continue }
    const rel = relative(root, runningRoot)
    if (isPackageInsideGlobalRoot(rel)) return { manager, globalRoot: root, ephemeral: false }
  }
  return { manager: null, ephemeral: false }
}

const isPackageInsideGlobalRoot = (path: string): boolean =>
  path === PACKAGE_NAME || path.startsWith(`${PACKAGE_NAME}${sep}`)

const capture = (command: string, args: string[]) => new Promise<{ code: number | null; stdout: string }>((resolve) => {
  const child = crossSpawn.spawn(command, args, { shell: false, stdio: ["ignore", "pipe", "ignore"] })
  let stdout = ""
  child.stdout?.setEncoding("utf8")
  child.stdout?.on("data", (chunk: string) => { stdout += chunk })
  child.on("error", () => resolve({ code: 1, stdout: "" }))
  child.on("exit", (code: number | null) => resolve({ code, stdout }))
})

const getLatestVersion = async (): Promise<string> => {
  const response = await fetch(`https://registry.npmjs.org/${PACKAGE_NAME}/latest`)
  if (!response.ok) throw new Error(`npm registry returned HTTP ${response.status}`)
  const body: unknown = await response.json()
  const version = readStableVersion(body)
  if (!version) {
    throw new Error("npm registry returned invalid stable version metadata")
  }
  return version
}

const readStableVersion = (value: unknown): string | null => {
  if (typeof value !== "object" || value === null || !("version" in value)) return null
  const version = value.version
  return typeof version === "string" && /^\d+\.\d+\.\d+$/.test(version) ? version : null
}

export const compareStableVersions = (a: string, b: string): number => {
  const left = a.split(".").map(Number)
  const right = b.split(".").map(Number)
  for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return (left[i] ?? 0) - (right[i] ?? 0)
  return 0
}

const emitError = (verbose: boolean, message: string): void => {
  if (verbose) process.stderr.write(`${pc.red("Update check failed")}: ${message}\n`)
  else printJson({ ok: false, code: "update_check_failed", message })
  process.exitCode = 1
}

const runUpdate = async (verbose: boolean): Promise<void> => {
  const currentVersion = readPackageVersion()
  let latestVersion: string
  try { latestVersion = await getLatestVersion() } catch (error) {
    emitError(verbose, error instanceof Error ? error.message : String(error))
    return
  }

  const available = compareStableVersions(latestVersion, currentVersion) > 0
  const install = await detectCliInstall()
  const result = await applyUpdate(install, available, currentVersion, latestVersion)
  if (verbose) printHumanResult(result, currentVersion, latestVersion)
  else printJson(result)
  if (result.ok === false) process.exitCode = 1
}

const applyUpdate = async (install: Install, available: boolean, currentVersion: string, latestVersion: string): Promise<Record<string, unknown>> => {
  let result: Record<string, unknown> = { ok: true, currentVersion, latestVersion, channel: "latest", updateAvailable: available, installation: install.ephemeral ? "ephemeral" : install.manager ?? "unknown", updated: false }
  if (!available || install.ephemeral || !install.manager) return addManualCommand(result, install, available)
  const command = install.manager
  const args = command === "npm" ? ["install", "-g", `${PACKAGE_NAME}@latest`] : ["add", "-g", `${PACKAGE_NAME}@latest`]
  try {
    const child = await spawnResult(command, args, { stdio: "pipe" })
    if (child.code !== 0 || child.signal) result = { ...result, ok: false, code: "update_failed", exitCode: child.code, signal: child.signal }
    else result = { ...result, updated: true }
  } catch (error) {
    result = { ...result, ok: false, code: "update_failed", message: error instanceof Error ? error.message : String(error) }
  }
  return result
}

const addManualCommand = (result: Record<string, unknown>, install: Install, available: boolean): Record<string, unknown> => {
  if (!available) return result
  let manualCommand = `npm install -g ${PACKAGE_NAME}@latest`
  if (install.manager === "pnpm" || install.manager === "pnpm dlx") manualCommand = `pnpm ${install.manager === "pnpm dlx" ? "dlx" : "add -g"} ${PACKAGE_NAME}@latest`
  if (install.manager === "npx") manualCommand = `npx ${PACKAGE_NAME}@latest`
  return { ...result, manualCommand }
}

const printHumanResult = (result: Record<string, unknown>, current: string, latest: string): void => {
  if (!result.updateAvailable) console.log(`${PACKAGE_NAME} is up to date (${current}).`)
  else if (result.updated) console.log(`Updated ${PACKAGE_NAME} to ${latest}.`)
  else console.log(`Update available: ${current} → ${latest}. Run: ${result.manualCommand}`)
}

export const updateCommand = new Command("update")
  .alias("upgrade")
  .description("Check for updates and update a recognized global install")
  .option("--verbose", "show human-readable update details")
  .action(async (options: { verbose?: boolean }) => runUpdate(options.verbose ?? false))
