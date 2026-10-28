import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, rmSync } from "node:fs"
import { resolve } from "node:path"

import { assertSupportedNode } from "./check-node.js"
import { validateDestination } from "./destination/validate.js"
import { renameRootPackage } from "./destination/rename-package.js"
import { extractTarball } from "./extract/extract.js"
import { publishOrRollback } from "./extract/publish-or-rollback.js"
import { validateEntries } from "./extract/validate-entries.js"
import { buildDryRunResult } from "./dry-run/build-dry-run-result.js"
import { aborted, CliError, internal } from "./errors/index.js"
import { readGeneratedPnpmVersion } from "./install/read-generated-pnpm-version.js"
import {
  recoveryCommand,
  recoveryCommandForNoInstall,
  recoveryCommandForReRun,
} from "./install/recovery.js"
import { runInstall } from "./install/run.js"
import { warnInstallBootstrap } from "./install/warn-install-bootstrap.js"
import { validateProjectName } from "./name/validate.js"
import {
  pickInstallStrategy,
  type InstallStrategy,
} from "./pm/install-strategy.js"
import { pnpm } from "./pm/pnpm.js"
import { probeInstallPrereqs } from "./pm/probe-paths.js"
import type { Logger } from "./output/logger.js"
import { nullLogger, stderrLogger } from "./output/logger.js"
import type {
  CreateFailure,
  CreateInstallFailure,
  CreateResult,
  ResultSource,
  ResultSourceMaybeSha,
} from "./result.js"
import { downloadTarball } from "./source/download-tarball.js"
import { resolveTemplateSha } from "./source/resolve-sha.js"

const REPO_OWNER = "deessejs"
const REPO_NAME = "saas-template"
const REPO_REF = "main"

function buildSource(sha: string): ResultSource
function buildSource(sha?: undefined): ResultSourceMaybeSha
function buildSource(sha?: string): ResultSourceMaybeSha {
  return {
    repo: `${REPO_OWNER}/${REPO_NAME}`,
    ref: REPO_REF,
    sha,
  }
}

export type RunInput = {
  projectName: string
  dir: string
  install: boolean
  /**
   * Plan the create without writing files, running install, or
   * executing template code. The pipeline still resolves the
   * source SHA, validates the archive, and (unless `--no-install`
   * is also set) probes install prereqs. The destination is never
   * created and the staging tempdir is cleaned before the result
   * is returned.
   */
  dryRun: boolean
  /**
   * When true, emit a one-line-per-step human narration of
   * pipeline progress to stderr via the `Logger` seam. The
   * JSON on stdout is unchanged either way; the narration
   * is informational and never writes to stdout. Default
   * is false (silent).
   */
  verbose: boolean
}

// State carried across the pipeline. Each step below takes the previous
// state and returns the next, with the mutable cleanup-affordances
// tracked in cleanupState() so the catch arm at the top can roll back.
//
// `exactOptionalPropertyTypes` is enabled in this repo, which means
// `key?: T` and `key: T | undefined` behave differently. We use the
// former (absent OR set) for keys the pipeline has not populated yet,
// and clear keys by deleting the property — never by assigning undefined.
type RunState = {
  input: RunInput
  signal: AbortSignal
  logger: Logger
  sha?: string
  tarballPath?: string
  tempDir?: string
  validatedEntries?: { path: string; size: number; mode: number }[]
  packageName?: { previous: string; current: string }
  // Resolved after publishProject. Used to build the install
  // command and the recovery. Populated by `resolvePrereqs` in
  // step 4.5 so the live install and the no-install recovery
  // share the same source of truth.
  prereqs?: { corepack: boolean; npm: boolean; pnpm: boolean }
  strategy?: InstallStrategy
  installCommand?: { bin: string; args: string[] }
  pnpmVersion?: string
}

const cleanupState = (state: RunState): void => {
  if (state.tempDir !== undefined && existsSync(state.tempDir)) {
    rmSync(state.tempDir, { recursive: true, force: true })
  }
  if (state.tarballPath !== undefined && existsSync(state.tarballPath)) {
    rmSync(state.tarballPath, { force: true })
  }
}

// ─── Steps ───────────────────────────────────────────────────────────────

// 1. Cheap checks that must run before any FS or network work.
const guardInvocationAndArgs = (input: RunInput): void => {
  assertSupportedNode(process.versions.node)
  validateProjectName(input.projectName)
  validateDestination(input.dir)
}

// 2. Resolve the immutable SHA and download the tarball for it.
const fetchSource = async (state: RunState): Promise<void> => {
  state.logger.info("resolving source SHA")
  state.sha = await resolveTemplateSha({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: REPO_REF,
    signal: state.signal,
  })
  state.logger.info("resolved source SHA", { sha: state.sha })
  const tarball = await downloadTarball({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    sha: state.sha,
    signal: state.signal,
  })
  state.tarballPath = tarball.path
  state.logger.info("downloaded archive")
}

// 3. Validate then extract into a fresh staging directory. The
//    root `package.json` is renamed INSIDE the staging tempdir so
//    both the real-create path (which renames immediately before
//    publishing) and the dry-run path (which renames before
//    building the plan) see the same `state.packageName` value.
const validateAndStage = async (state: RunState): Promise<void> => {
  if (!state.sha || !state.tarballPath) {
    throw internal("fetchSource did not populate sha/tarballPath")
  }
  state.logger.info("validating archive entries")
  const validated = await validateEntries({
    tarballPath: state.tarballPath,
    sha: state.sha,
    repo: REPO_NAME,
    signal: state.signal,
  })
  state.validatedEntries = validated.entries
  state.logger.info("validated entries", { count: validated.entries.length })

  const tempDir = resolve(state.input.dir + ".staging." + randomUUID())
  if (existsSync(tempDir)) {
    // UUID v4 collision — virtually impossible, but be safe.
    rmSync(tempDir, { recursive: true, force: true })
  }
  mkdirSync(tempDir, { recursive: true })
  // Stash the tempdir on state BEFORE the extract so the
  // catch arm can clean it up if extract throws (e.g. an
  // AbortError mid-tarball). Without this assignment the
  // catch arm sees `state.tempDir === undefined` and
  // leaks the directory.
  state.tempDir = tempDir

  await extractTarball({
    tarballPath: state.tarballPath,
    tempDir,
    sha: state.sha,
    repo: REPO_NAME,
    signal: state.signal,
  })

  state.packageName = renameRootPackage({
    tempDir: state.tempDir,
    newName: state.input.projectName,
  })
  state.logger.info("staged template", { path: state.input.projectName })
}

// 4. Publish the staged directory atomically. After this step
//    the project is on disk at `dir`. Skipped entirely under
//    `--dry-run`: the dry-run branch fires before this step.
const publishProject = async (state: RunState): Promise<void> => {
  if (!state.tempDir || !state.sha) {
    throw internal("validateAndStage did not populate tempDir/sha")
  }
  // exactOptionalPropertyTypes: pass the optional `tarballPath` only when
  // present. The keys-not-undefined convention this codebase uses.
  await publishOrRollback({
    tempDir: state.tempDir,
    destination: state.input.dir,
    ...(state.tarballPath !== undefined
      ? { tarballPath: state.tarballPath }
      : {}),
  })
  // ownership transferred — clear so cleanupState doesn't rm a live dir
  delete state.tempDir
  state.logger.info("published project", { destination: state.input.dir })
}

// 4.5. Resolve install prereqs and strategy. The probe runs only
// when the user did not pass `--no-install`. The strategy and
// install command are stashed on state for the live install
// path (5b) and the no-install path (5a) to share. If the
// generated project's `packageManager` field is missing or
// malformed, the `readGeneratedPnpmVersion` helper throws
// `source_failed`; the catch arm at the top translates that
// into the right JSON shape.
//
// Under `--dry-run` the probe and strategy are still
// computed when the user did not pass `--no-install`: the
// plan describes what install WOULD run. The caller (the
// dry-run branch in `run`) is responsible for invoking
// `resolvePrereqs` at the right point.
const resolvePrereqs = (state: RunState): void => {
  if (!state.input.install) {
    // --no-install is offline: no probe, no strategy, no
    // warning. The recovery command is built from
    // readGeneratedPnpmVersion + recoveryCommandForNoInstall.
    return
  }
  state.logger.info("probing install prereqs")
  state.prereqs = probeInstallPrereqs()
  state.pnpmVersion = readGeneratedPnpmVersionSafe(state)
  state.strategy = pickInstallStrategy({
    corepackAvailable: state.prereqs.corepack,
    npmAvailable: state.prereqs.npm,
    pnpmAvailable: state.prereqs.pnpm,
  })
  state.installCommand = pnpm.installCommand(state.strategy, state.pnpmVersion)
  state.logger.info("install strategy chosen", { strategy: state.strategy })
  warnInstallBootstrap(
    state.strategy,
    state.input.dryRun ? "dry-run" : "create"
  )
}

// Same as readGeneratedPnpmVersion, but translates
// source_failed into the right shape for the pipeline. The
// catch arm at the top of `run` handles the throw.
const readGeneratedPnpmVersionSafe = (state: RunState): string => {
  if (!state.sha) {
    throw internal("resolvePrereqs called before publishProject")
  }
  // Under --dry-run the destination does not exist; the
  // renamed package.json lives in the staging tempdir.
  // Under real-create, `state.tempDir` was deleted by
  // publishProject's `delete state.tempDir`; the function
  // uses the destination path in that case.
  const packageJsonDir = state.input.dryRun
    ? (state.tempDir ?? state.input.dir)
    : state.input.dir
  return readGeneratedPnpmVersion(packageJsonDir)
}

// 5a. Skip-install path.
const buildNoInstallResult = (state: RunState): CreateResult => {
  if (!state.sha || !state.packageName) {
    throw internal("publishProject did not populate sha/packageName")
  }
  // The recovery command is deterministic and offline: it
  // does not depend on what is on PATH. We read the
  // generated project's `packageManager` field, which is
  // present after publishProject.
  let recovery: string | null
  try {
    const version = readGeneratedPnpmVersion(state.input.dir)
    recovery = recoveryCommandForNoInstall({
      version,
      cwd: state.input.dir,
    })
  } catch (err) {
    if (err instanceof CliError && err.code === "source_failed") {
      recovery = null
    } else {
      throw err
    }
  }
  return {
    ok: true,
    mode: "create",
    projectCreated: true,
    installed: false,
    source: buildSource(state.sha),
    destination: state.input.dir,
    packageName: state.packageName,
    packageManager: "pnpm",
    recovery,
  }
}

// 5b. Run install, return success / install-failure.
const runInstallAndBuildResult = async (
  state: RunState
): Promise<CreateResult> => {
  if (
    !state.sha ||
    !state.packageName ||
    !state.installCommand ||
    !state.strategy
  ) {
    throw internal("resolvePrereqs did not populate install metadata")
  }
  state.logger.info("running install", { cwd: state.input.dir })
  const installResult = await runInstall({
    command: state.installCommand,
    managerId: "pnpm",
    cwd: state.input.dir,
    signal: state.signal,
  })

  if (installResult.ok) {
    state.logger.info("install completed")
    return {
      ok: true,
      mode: "create",
      projectCreated: true,
      installed: true,
      source: buildSource(state.sha),
      destination: state.input.dir,
      packageName: state.packageName,
      packageManager: "pnpm",
      recovery: recoveryCommand({
        command: state.installCommand,
        cwd: state.input.dir,
      }),
    }
  }

  // Aborted mid-install: the child was killed by the
  // AbortSignal. The project is on disk; the user can
  // re-run the install (the recovery is the install
  // command, NOT the create-deesse-app re-run form).
  // The `aborted` field is the discriminator: the
  // non-aborted failure variant sets `aborted: false`
  // and has `code: number`; the aborted variant sets
  // `aborted: true` and has `code: number | null`.
  if (installResult.aborted) {
    // The `code` may be `null` when the child was killed
    // by SIGTERM/SIGKILL and never exited on its own.
    // Surface the killed status as a string the human
    // reader can act on; downstream tooling reads
    // `error.code: "aborted"` and ignores the field.
    const codeLabel =
      installResult.code === null ? "killed" : installResult.code
    state.logger.error("cancelled", { code: codeLabel })
    const failure: CreateFailure = {
      ok: false,
      mode: "create",
      projectCreated: true,
      source: buildSource(state.sha),
      destination: state.input.dir,
      error: aborted(),
      recovery: recoveryCommand({
        command: state.installCommand,
        cwd: state.input.dir,
      }),
    }
    return failure
  }

  // Non-aborted failure: TypeScript narrows away the
  // `aborted: true` variant, so `code` is `number` here.
  state.logger.error("install failed", { code: installResult.code })
  // Install failed. Project is on disk; surface as install-failure. The
  // install log is mirrored to stderr in src/index.ts and the captured
  // output is included in the JSON for scripts.
  const failure: CreateInstallFailure = {
    ok: false,
    mode: "create",
    projectCreated: true,
    installed: false,
    source: state.sha === undefined ? buildSource() : buildSource(state.sha),
    destination: state.input.dir,
    error: {
      code: "install_failed",
      message: `pnpm install exited with code ${installResult.code}`,
      hint: "inspect the install log on stderr, then run the recovery command below",
    },
    recovery: recoveryCommand({
      command: state.installCommand,
      cwd: state.input.dir,
    }),
    installOutput: {
      code: installResult.code,
      stderr: installResult.stderr,
      stdout: installResult.stdout,
    },
  }
  return failure
}

// ─── Orchestration ──────────────────────────────────────────────────────

export const run = async (input: RunInput): Promise<CreateResult> => {
  const abortController = new AbortController()
  // The default logger is `nullLogger`; we pick
  // `stderrLogger` when `input.verbose` is true. Tests that
  // need to observe narration should pass `verbose: true`
  // and provide a writer through the module (not through
  // public API) — or override `state.logger` before
  // `guardInvocationAndArgs` is awaited.
  const state: RunState = {
    input,
    signal: abortController.signal,
    logger: input.verbose ? stderrLogger() : nullLogger,
  }
  state.logger.info(input.dryRun ? "starting dry-run" : "starting create", {
    project: input.projectName,
    dir: input.dir,
    install: input.install,
  })

  // The first SIGINT aborts in-flight IO and triggers the
  // cleanup path. The second SIGINT (the user's "I really
  // mean it") is left to fall through to Node's default
  // SIGINT handler (kill the process). `process.once` is
  // critical: with `process.on`, a second Ctrl+C would still
  // hit our handler and never kill the runner.
  const onSigint = (): void => {
    abortController.abort()
  }
  process.once("SIGINT", onSigint)

  try {
    guardInvocationAndArgs(input)
    await fetchSource(state)
    await validateAndStage(state)

    if (input.dryRun) {
      // Dry-run short-circuits before publishProject: the
      // destination is never created, no install is run, and
      // the staging tempdir is cleaned before we return.
      // `resolvePrereqs` runs here (not before) so the probe
      // sees the same PATH a real create would see, and so
      // the warning about the bootstrap is emitted in the
      // same place.
      resolvePrereqs(state)
      // The dry-run fires AFTER validateAndStage, which
      // always populates sha, tempDir, packageName, and
      // validatedEntries. The narrow below makes the
      // strict-optional types accept the call without
      // requiring the `!` non-null assertion.
      if (
        state.sha === undefined ||
        state.tempDir === undefined ||
        state.packageName === undefined ||
        state.validatedEntries === undefined
      ) {
        throw internal("validateAndStage did not populate dry-run state")
      }
      const result = buildDryRunResult({
        sha: state.sha,
        destination: state.input.dir,
        packageName: state.packageName,
        entries: state.validatedEntries,
        install: state.input.install,
        prereqs: state.prereqs,
        strategy: state.strategy,
        installCommand: state.installCommand,
        pnpmVersion: state.pnpmVersion,
      })
      cleanupState(state)
      state.logger.info("dry-run plan ready", {
        files: result.plannedFiles.length,
      })
      return result
    }

    await publishProject(state)
    resolvePrereqs(state)

    if (!input.install) {
      state.logger.info("install skipped")
      return buildNoInstallResult(state)
    }
    return await runInstallAndBuildResult(state)
  } catch (err) {
    cleanupState(state)
    if (isAbortError(err)) {
      return buildAbortFailure(state)
    }
    if (err instanceof CliError) {
      return buildCliErrorFailure(state, err)
    }
    throw internal(err instanceof Error ? err.message : String(err))
  } finally {
    // Remove the SIGINT listener so it does not leak into
    // other code paths or accumulate across invocations in
    // test contexts.
    process.off("SIGINT", onSigint)
  }
}

// We accept any error whose name is "AbortError" (the
// `fetch`/`tar`/`AbortController` convention) as the cancel
// signal. The custom `AbortError` class we use in
// `resolveTemplateSha` declares this name; the built-in
// `DOMException("AbortError")` and `tar`'s own abort
// exceptions all do too.
const isAbortError = (err: unknown): boolean =>
  err instanceof Error && err.name === "AbortError"

// Build the `CreateFailure` for the abort (cancel) path.
// The recovery depends on whether the project landed on
// disk: if `publishProject` ran, the user can re-run
// just the install (the install command is on state);
// otherwise, the user re-invokes the CLI from scratch.
const buildAbortFailure = (state: RunState): CreateFailure => {
  state.logger.error("cancelled")
  const published = isProjectPublished(state)
  const failure: CreateFailure = {
    ok: false,
    mode: state.input.dryRun ? "dry-run" : "create",
    projectCreated: published,
    source: state.sha === undefined ? buildSource() : buildSource(state.sha),
    error: aborted(),
    ...(published ? { destination: state.input.dir } : {}),
  }
  if (published && state.installCommand) {
    failure.recovery = recoveryCommand({
      command: state.installCommand,
      cwd: state.input.dir,
    })
  } else {
    failure.recovery = recoveryCommandForReRun({
      projectName: state.input.projectName,
      dir: state.input.dir,
      install: state.input.install,
      defaultDir: defaultDir(state.input),
    })
  }
  return failure
}

// Build the `CreateFailure` for the `CliError` path
// (source_failed, unsupported_manager, etc.). When the
// project is on disk, the failure reports
// `projectCreated: true` and attaches the no-install
// recovery; otherwise, the JSON tells the truth and the
// user gets no recovery (no command would help).
const buildCliErrorFailure = (
  state: RunState,
  err: CliError
): CreateFailure => {
  const published = isProjectPublished(state)
  state.logger.error("error", { code: err.code, message: err.message })
  const failure: CreateFailure = {
    ok: false,
    mode: state.input.dryRun ? "dry-run" : "create",
    projectCreated: published,
    source: state.sha === undefined ? buildSource() : buildSource(state.sha),
    error: { code: err.code, message: err.message, hint: err.hint },
    ...(published ? { destination: state.input.dir } : {}),
  }
  if (!published) return failure
  // Attach the no-install recovery. The version is
  // read from the published project's `packageManager`;
  // a missing or malformed field leaves the recovery
  // absent (the JSON shape is still valid: `recovery`
  // is optional on `CreateFailure`).
  try {
    const version = readGeneratedPnpmVersion(state.input.dir)
    failure.recovery = recoveryCommandForNoInstall({
      version,
      cwd: state.input.dir,
    })
  } catch (readErr) {
    if (readErr instanceof CliError && readErr.code === "source_failed") {
      return failure
    }
    throw readErr
  }
  return failure
}

// True iff the project files are on disk at the
// destination. Single source of truth for the catch arm
// (and any future failure path that needs to know).
//
// `state.tempDir` is `delete`d inside `publishProject` on
// success, so a missing `tempDir` after a real-create
// pass means the project is on disk. The dry-run path
// never calls `publishProject`, so the helper returns
// false for dry-run regardless. The `--no-install` path
// calls `publishProject` and then `resolvePrereqs`; if
// the prereq probe succeeds, the helper is irrelevant
// (we go on to `buildNoInstallResult`); if it throws,
// the project IS on disk and the helper returns true.
const isProjectPublished = (state: RunState): boolean =>
  !state.input.dryRun && state.tempDir === undefined

// The default destination path the user would have if
// they had not passed `--dir`. Mirrors the
// `resolve(process.cwd(), \`./${projectName}\`)` rule in
// `src/index.ts`. We pass it to the re-run recovery
// helper so the helper knows whether the user's `--dir`
// was a custom path or the default. The cwd is
// captured at call time, which is fine because the
// failure is happening in the same process the user
// started in.
const defaultDir = (input: RunInput): string =>
  resolve(process.cwd(), `./${input.projectName}`)
