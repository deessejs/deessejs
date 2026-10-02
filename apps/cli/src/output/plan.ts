/**
 * Build a human + machine readable plan describing what an
 * `init` (or future `add`) invocation WOULD do, without writing
 * to disk or running installs.
 *
 * The plan is the structured output of `--dry-run`. It mirrors
 * the descriptor fields that drive disk side effects, so the user
 * (or a CI script) can audit the impact before committing.
 *
 * Why this lives in `output/`, not `commands/init.ts`:
 *   - The plan shape is part of the CLI's wire contract (consumed
 *     by `--json` mode). Keeping it in `output/` mirrors the
 *     `printTemplatesTable` / `printTemplateInfo` pattern.
 *   - When `deessejs add` lands (RFC-003), it can call
 *     `buildInstallPlan` against `BlockV1` and the user-facing
 *     plan shape stays identical.
 */

import { existsSync } from "node:fs"
import { resolve } from "node:path"
import pc from "picocolors"

import type { TemplateV2 } from "@workspace/registry-client"

/** A single file that would be written under `targetDir`. */
export type PlannedFile = {
  /** Path as declared in the descriptor (`spec.target ?? spec.path`). */
  readonly path: string
  /** Resolved absolute path under the user's `targetDir`. */
  readonly target: string
  /**
   * True when the resolved path collides with an existing file
   * on disk. Surfaced only in dry-run so the user can decide
   * whether to pass `--force`.
   */
  readonly wouldOverwrite: boolean
}

/** Lifecycle hooks the descriptor declares (postInit / postInstall). */
export type PlannedHooks = {
  readonly postInit: readonly string[]
  readonly postInstall: readonly string[]
}

/** Dependency declarations the descriptor surfaces. */
export type PlannedDeps = {
  readonly runtime: readonly string[]
  readonly dev: readonly string[]
}

/**
 * The complete plan a `deessejs init` run would execute.
 *
 * `source` and `version` come from the descriptor; everything else
 * is computed against the user's `targetDir` and `process.cwd()`.
 */
export type InstallPlan = {
  readonly slug: string
  readonly title: string
  readonly version: string
  readonly source: string
  readonly targetDir: string
  readonly files: readonly PlannedFile[]
  readonly hooks: PlannedHooks
  readonly deps: PlannedDeps
  /** Number of `prompts[]` entries the install sequence will ask. */
  readonly promptCount: number
  /**
   * True when `targetDir` already exists and contains files.
   * The CLI does NOT refuse the dry-run — it surfaces the collision
   * so the user can decide whether `--force` is appropriate.
   */
  readonly wouldOverwriteTarget: boolean
}

/** Minimal local-FS inspector — injected so tests can run offline. */
export type FsProbe = (path: string) => boolean

const defaultFsProbe: FsProbe = (path) => existsSync(path)

/**
 * Build an InstallPlan from a validated descriptor + the target
 * directory the user passed on the command line.
 *
 * `fsProbe` is injectable; production callers pass `defaultFsProbe`
 * (or omit it). Tests use an in-memory map.
 *
 * The function is pure: no side effects, no I/O beyond the probe
 * reads. The `fsProbe` injection lets unit tests assert the plan
 * shape without touching the real filesystem.
 */
export const buildInstallPlan = (
  descriptor: TemplateV2,
  slug: string,
  targetDir: string,
  fsProbe: FsProbe = defaultFsProbe,
  resolvedFiles?: ReadonlyArray<{ readonly path: string; readonly target?: string }>,
): InstallPlan => {
  const files: PlannedFile[] = []
  if (resolvedFiles && resolvedFiles.length > 0) {
    // The init command resolved the file list via the SDK
    // (`client.resolveTemplate(slug)`). Use that resolved list — it's
    // already authoritative (glob pipeline applied, descriptor.files
    // deduped against `includes/excludes/fileTypes`).
    for (const f of resolvedFiles) {
      const path = f.target ?? f.path
      const target = resolve(targetDir, path)
      files.push({ path, target, wouldOverwrite: fsProbe(target) })
    }
  } else {
    // V1 fallback: build the file list from the descriptor's explicit
    // `files[]` entry. Preserves backwards-compat for callers that
    // don't pass resolution (e.g. unit tests with synthetic fixtures).
    for (const spec of descriptor.files ?? []) {
      const path = spec.target ?? spec.path
      const target = resolve(targetDir, path)
      files.push({ path, target, wouldOverwrite: fsProbe(target) })
    }
  }
  const wouldOverwriteTarget = fsProbe(targetDir)
  const deps: PlannedDeps = {
    runtime: (descriptor.dependencies ?? []).map((d) => String(d)),
    dev: (descriptor.devDependencies ?? []).map((d) => String(d)),
  }
  const hooks: PlannedHooks = {
    postInit: descriptor.hooks?.postInit ?? [],
    postInstall: descriptor.hooks?.postInstall ?? [],
  }
  const promptCount = descriptor.prompts?.length ?? 0
  return {
    slug,
    title: descriptor.title,
    version: descriptor.version,
    source: descriptor.source.repo,
    targetDir,
    files,
    hooks,
    deps,
    promptCount,
    wouldOverwriteTarget,
  }
}

/**
 * Render the plan to stdout as a human-readable summary.
 *
 * The output is grouped by section (source, target, files, hooks,
 * deps, prompts) and uses picocolors for syntax highlighting.
 * Use `printJson(plan)` for machine-readable output instead.
 */
export const printInstallPlan = (plan: InstallPlan): void => {
  const lines: string[] = []
  lines.push(
    `${pc.cyan("Plan for")} ${pc.bold(plan.title)} ${pc.dim(`v${plan.version}`)}`,
  )
  lines.push(`  ${pc.dim("Source:")}      ${plan.source}`)
  lines.push(`  ${pc.dim("Target dir:")}  ${plan.targetDir}`)
  lines.push(
    `  ${pc.dim("Files:")}       ${plan.files.length}` +
      (plan.wouldOverwriteTarget
        ? ` ${pc.yellow("(target dir already exists)")}`
        : ""),
  )
  if (plan.hooks.postInit.length > 0) {
    lines.push(
      `  ${pc.dim("Hooks:")}       postInit (${plan.hooks.postInit.length})`,
    )
  }
  if (plan.hooks.postInstall.length > 0) {
    lines.push(
      `  ${pc.dim("Hooks:")}       postInstall (${plan.hooks.postInstall.length})`,
    )
  }
  if (plan.deps.runtime.length > 0) {
    lines.push(
      `  ${pc.dim("Deps:")}        ${plan.deps.runtime.join(", ")}`,
    )
  }
  if (plan.deps.dev.length > 0) {
    lines.push(
      `  ${pc.dim("Dev deps:")}    ${plan.deps.dev.join(", ")}`,
    )
  }
  if (plan.promptCount > 0) {
    lines.push(
      `  ${pc.dim("Prompts:")}     ${plan.promptCount}` +
        ` ${pc.dim("(will run before any disk write)")}`,
    )
  }
  if (plan.files.some((f) => f.wouldOverwrite)) {
    const overwritePaths = plan.files
      .filter((f) => f.wouldOverwrite)
      .map((f) => f.target)
    lines.push("")
    lines.push(
      `  ${pc.yellow("Would overwrite:")} ${overwritePaths.length} existing file(s)`,
    )
    for (const p of overwritePaths) {
      lines.push(`    - ${p}`)
    }
  }
  lines.push("")
  lines.push(
    pc.dim("Run without --dry-run to apply."),
  )
  process.stdout.write(lines.join("\n") + "\n")
}