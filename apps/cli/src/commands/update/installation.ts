import { CLI_PACKAGE_NAME } from "./constants.js"
import type {
  CliInstallation,
  EphemeralInstallation,
  EphemeralLauncher,
  GlobalInstallation,
  InstallationDetectionOptions,
  RunCommandAndCaptureStdout,
  UnknownInstallation,
} from "./types.js"
import { realpathSync } from "node:fs"
import { dirname, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"
import * as crossSpawn from "cross-spawn"

const PACKAGE_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

/**
 * Runs an external command without a shell and captures stdout for read-only
 * inspection. This is used only for asking package managers for their global
 * root; it does not install or mutate packages. Errors and non-zero exits are
 * represented by a failed result so detection can safely continue as unknown.
 *
 * @param command - Executable name resolved using cross-spawn's platform rules.
 * @param args - Separate argv values, never a shell command string.
 * @returns Exit code and captured stdout; spawn errors return code `1` and empty
 * stdout.
 */
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

/**
 * Constructs the persistent installation state after the package root has
 * been matched against a manager's global root.
 *
 * @param manager - Package manager that owns the global installation.
 * @param globalRoot - Canonical global node_modules directory.
 * @returns A discriminated persistent-installation value.
 */
export const createGlobalInstallation = (
  manager: GlobalInstallation["manager"],
  globalRoot: string
): GlobalInstallation => ({ kind: "global", manager, globalRoot })

/**
 * Constructs the state for a recognized temporary package launcher.
 *
 * @param launcher - Ephemeral launcher identified from process evidence.
 * @returns A discriminated ephemeral-installation value.
 */
export const createEphemeralInstallation = (
  launcher: EphemeralLauncher
): EphemeralInstallation => ({
  kind: "ephemeral",
  launcher,
})

/**
 * Constructs the conservative fallback state used when ownership is unproven.
 *
 * @returns An unknown installation value, which must never trigger an update.
 */
export const createUnknownInstallation = (): UnknownInstallation => ({
  kind: "unknown",
})

/**
 * Classifies how this running CLI was installed. Ephemeral launcher evidence
 * takes precedence. Otherwise, the resolved CLI package directory must be
 * inside a global npm or pnpm package root before the result is considered
 * updateable. Project lockfiles and mere manager availability are not proof of
 * ownership, so inconclusive cases return `unknown` and cannot trigger an
 * installer.
 *
 * @param options - Optional path, launcher metadata, and command runner seams
 * for deterministic tests. Production calls use process context and
 * cross-spawn.
 * @returns A discriminated installation state. Detection subprocess failures
 * do not throw; they result in `unknown`.
 */
export const detectCliInstallation = async (
  options: InstallationDetectionOptions = {}
): Promise<CliInstallation> => {
  const executablePath = options.executablePath ?? process.argv[1] ?? ""
  const userAgent = options.userAgent ?? process.env.npm_config_user_agent ?? ""
  const ephemeral = detectEphemeralLauncher(userAgent, executablePath)
  if (ephemeral) return createEphemeralInstallation(ephemeral)

  const runningPackageRoot = options.packageRoot ?? PACKAGE_ROOT
  let canonicalPackageRoot: string
  try {
    canonicalPackageRoot = realpathSync(runningPackageRoot)
  } catch {
    return createUnknownInstallation()
  }

  const runCommand = options.runCommand ?? runCommandAndCaptureStdout
  for (const manager of ["npm", "pnpm"] as const) {
    const { code, stdout } = await runCommand(manager, ["root", "-g"])
    if (code !== 0 || !stdout.trim()) continue
    const globalRoot = canonicalize(stdout.trim())
    if (!globalRoot) continue
    if (isPackageInsideGlobalRoot(globalRoot, canonicalPackageRoot)) {
      return createGlobalInstallation(manager, globalRoot)
    }
  }
  return createUnknownInstallation()
}

/**
 * Detects temporary npm/pnpm launcher executions from their manager-provided
 * user-agent and cache path. Both signals are required to avoid mistaking an
 * ordinary local execution for an ephemeral install.
 *
 * @param userAgent - Package-manager user-agent from the current environment.
 * @param executablePath - Entry path used to start this CLI process.
 * @returns Launcher identity when recognized, otherwise `null`.
 */
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

/**
 * Resolves a path through symlinks for safe comparison with the package root.
 * Missing and inaccessible paths are expected during detection and return
 * `null` instead of interrupting the update check.
 *
 * @param path - Candidate filesystem path.
 * @returns Canonical path, or `null` when it cannot be resolved.
 */
const canonicalize = (path: string): string | null => {
  try {
    return realpathSync(path)
  } catch {
    return null
  }
}

/**
 * Checks that the running package root is the CLI package or one of its
 * descendants beneath the reported manager root. `relative` keeps this check
 * separator-aware across Unix and Windows paths.
 *
 * @param globalRoot - Canonical global node_modules root.
 * @param packageRoot - Canonical directory containing the running CLI bundle.
 * @returns Whether the package belongs to that global root.
 */
const isPackageInsideGlobalRoot = (
  globalRoot: string,
  packageRoot: string
): boolean => {
  const pathFromGlobalRoot = relative(globalRoot, packageRoot)
  return (
    pathFromGlobalRoot === CLI_PACKAGE_NAME ||
    pathFromGlobalRoot.startsWith(`${CLI_PACKAGE_NAME}${sep}`)
  )
}
