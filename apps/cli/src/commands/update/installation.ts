import { realpathSync } from "node:fs"
import { dirname, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"
import * as crossSpawn from "cross-spawn"

const PACKAGE_NAME = "@deessejs/cli"
const PACKAGE_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

export type GlobalPackageManager = "npm" | "pnpm"
export type EphemeralLauncher = "npx" | "pnpm-dlx"

export type CliInstallation =
  | { kind: "global"; manager: GlobalPackageManager; globalRoot: string }
  | { kind: "ephemeral"; launcher: EphemeralLauncher }
  | { kind: "unknown" }

export type CommandOutput = { code: number | null; stdout: string }
export type RunCommandAndCaptureStdout = (
  command: string,
  args: string[]
) => Promise<CommandOutput>

export const runCommandAndCaptureStdout: RunCommandAndCaptureStdout = (
  command,
  args
) =>
  new Promise((resolve) => {
    const child = crossSpawn.spawn(command, args, {
      shell: false,
      stdio: ["ignore", "pipe", "ignore"],
    })
    let stdout = ""
    child.stdout?.setEncoding("utf8")
    child.stdout?.on("data", (chunk: string) => {
      stdout += chunk
    })
    child.on("error", () => resolve({ code: 1, stdout: "" }))
    child.on("exit", (code) => resolve({ code, stdout }))
  })

export type InstallationDetectionOptions = {
  packageRoot?: string
  executablePath?: string
  userAgent?: string
  runCommand?: RunCommandAndCaptureStdout
}

export const detectCliInstallation = async (
  options: InstallationDetectionOptions = {}
): Promise<CliInstallation> => {
  const executablePath = options.executablePath ?? process.argv[1] ?? ""
  const userAgent = options.userAgent ?? process.env.npm_config_user_agent ?? ""
  const ephemeral = detectEphemeralLauncher(userAgent, executablePath)
  if (ephemeral) return { kind: "ephemeral", launcher: ephemeral }

  const runningPackageRoot = options.packageRoot ?? PACKAGE_ROOT
  let canonicalPackageRoot: string
  try {
    canonicalPackageRoot = realpathSync(runningPackageRoot)
  } catch {
    return { kind: "unknown" }
  }

  const runCommand = options.runCommand ?? runCommandAndCaptureStdout
  for (const manager of ["npm", "pnpm"] as const) {
    const { code, stdout } = await runCommand(manager, ["root", "-g"])
    if (code !== 0 || !stdout.trim()) continue
    const globalRoot = canonicalize(stdout.trim())
    if (!globalRoot) continue
    if (isPackageInsideGlobalRoot(globalRoot, canonicalPackageRoot)) {
      return { kind: "global", manager, globalRoot }
    }
  }
  return { kind: "unknown" }
}

const detectEphemeralLauncher = (
  userAgent: string,
  executablePath: string
): EphemeralLauncher | null => {
  if (/npm\//i.test(userAgent) && /(?:_npx|npm-cache)/i.test(executablePath)) {
    return "npx"
  }
  if (/pnpm\//i.test(userAgent) && /(?:dlx|_tmp)/i.test(executablePath)) {
    return "pnpm-dlx"
  }
  return null
}

const canonicalize = (path: string): string | null => {
  try {
    return realpathSync(path)
  } catch {
    return null
  }
}

const isPackageInsideGlobalRoot = (
  globalRoot: string,
  packageRoot: string
): boolean => {
  const pathFromGlobalRoot = relative(globalRoot, packageRoot)
  return (
    pathFromGlobalRoot === PACKAGE_NAME ||
    pathFromGlobalRoot.startsWith(`${PACKAGE_NAME}${sep}`)
  )
}
