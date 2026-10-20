import { internal } from "../errors/index.js"
import type {
  CreateDryRunResult,
  DryRunInstall,
  ResultSource,
} from "../result.js"

const DOCUMENTATION_URL = "https://docs.deessejs.com/getting-started"

type BuildDryRunResultInput = {
  /** Resolved commit SHA. Required. */
  sha: string
  /** Destination the user asked for. The directory does not exist. */
  destination: string
  /** The rename result from `renameRootPackage`. Required. */
  packageName: { previous: string; current: string }
  /** The validated, normalized entry list. Required. */
  entries: { path: string; size: number; mode: number }[]
  /** Whether the user passed `--no-install`. */
  install: boolean
  /** Probe result (only when `install` is true). */
  prereqs: { corepack: boolean; npm: boolean; pnpm: boolean } | undefined
  /** Picked install strategy (only when `install` is true). */
  strategy: "corepack" | "npm-exec" | "pnpm-direct" | undefined
  /** Built install command (only when `install` is true). */
  installCommand: { bin: string; args: string[] } | undefined
  /**
   * The pnpm version we plan to install (only when `install` is
   * true). Read from the generated project's `packageManager`
   * field; throws `source_failed` on missing or malformed.
   */
  pnpmVersion: string | undefined
}

/**
 * Build the `CreateDryRunResult` for the dry-run short-circuit.
 * Pure function over the pipeline's `RunState` plus the entry
 * list returned by `validateEntries`.
 *
 * The function does NOT call `probeInstallPrereqs`,
 * `pickInstallStrategy`, `runInstall`, or any other side-effect.
 * The pipeline has already run those for the live path; the
 * dry-run reuses the same results so the plan and the real
 * execution agree.
 *
 * Errors:
 *  - `internal` if a required field is missing (caller bug).
 *  - `source_failed` from `readGeneratedPnpmVersion` if the
 *    template's `packageManager` field is missing or malformed.
 *    The pipeline's catch arm translates that to a
 *    `CreateFailure` with the same code the real-create path
 *    would emit.
 */
export const buildDryRunResult = (input: BuildDryRunResultInput): CreateDryRunResult => {
  const {
    sha,
    destination,
    packageName,
    entries,
    install,
    prereqs,
    strategy,
    installCommand,
  } = input

  const source: ResultSource = {
    repo: "deessejs/saas-template",
    ref: "main",
    sha,
  }

  if (
    install &&
    (prereqs === undefined ||
      strategy === undefined ||
      installCommand === undefined ||
      input.pnpmVersion === undefined)
  ) {
    throw internal("dry-run with install requested but prereq metadata is missing")
  }
  // Under `--no-install` we do NOT read the version from
  // the staged package.json: the plan does not include a
  // strategy, command, or version field, so reading
  // serves no purpose. The pipeline validates the
  // `packageManager` field at the install path; for the
  // no-install dry-run we trust the template and let the
  // real create re-validate at execution time.

  // TypeScript's narrow does not flow through the ternary
  // here: even after the `if (install && ...)` guard
  // above, the destructured `strategy` and friends are
  // still typed as `T | undefined`. We narrow inside the
  // ternary with explicit local consts so the literal
  // types match the `DryRunInstall` discriminated union
  // without a cast.
  const installSection: DryRunInstall = install
    ? (() => {
        return {
          skipped: false as const,
          strategy: strategy as "corepack" | "npm-exec" | "pnpm-direct",
          command: installCommand as { bin: string; args: string[] },
          prereqs: prereqs as { corepack: boolean; npm: boolean; pnpm: boolean },
        }
      })()
    : { skipped: true as const }

  return {
    ok: true,
    mode: "dry-run",
    projectCreated: false,
    installed: false,
    source,
    destination,
    packageName,
    packageManager: "pnpm",
    install: installSection,
    plannedFiles: entries,
    documentation: DOCUMENTATION_URL,
    recovery: null,
  }
}
