import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, rmSync } from "node:fs"
import { resolve } from "node:path"

import { validateDestination } from "./destination/validate.js"
import { renameRootPackage } from "./destination/rename-package.js"
import { extractTarball } from "./extract/extract.js"
import { publishOrRollback } from "./extract/publish-or-rollback.js"
import { validateEntries } from "./extract/validate-entries.js"
import { CliError, internal } from "./errors/index.js"
import { recoveryCommand } from "./install/recovery.js"
import { runInstall } from "./install/run.js"
import { validateProjectName } from "./name/validate.js"
import { pnpm } from "./pm/pnpm.js"
import { assertNotNpmInvocation } from "./pm/detect-invoker.js"
import type {
  CreateFailure,
  CreateInstallFailure,
  CreateResult,
  ResultSourceMaybeSha,
} from "./result.js"
import { downloadTarball } from "./source/download-tarball.js"
import { resolveTemplateSha } from "./source/resolve-sha.js"

const REPO_OWNER = "deessejs"
const REPO_NAME = "saas-template"
const REPO_REF = "main"

const buildSource = (sha?: string): ResultSourceMaybeSha => ({
  repo: `${REPO_OWNER}/${REPO_NAME}`,
  ref: REPO_REF,
  sha,
})

export type RunInput = {
  projectName: string
  dir: string
  install: boolean
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
  sha?: string
  tarballPath?: string
  tempDir?: string
  packageName?: { previous: string; current: string }
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
  assertNotNpmInvocation()
  validateProjectName(input.projectName)
  validateDestination(input.dir)
}

// 2. Resolve the immutable SHA and download the tarball for it.
const fetchSource = async (state: RunState): Promise<void> => {
  state.sha = await resolveTemplateSha({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: REPO_REF,
  })
  const tarball = await downloadTarball({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    sha: state.sha,
  })
  state.tarballPath = tarball.path
}

// 3. Validate then extract into a fresh staging directory.
const validateAndStage = async (state: RunState): Promise<void> => {
  if (!state.sha || !state.tarballPath) {
    throw internal("fetchSource did not populate sha/tarballPath")
  }
  await validateEntries({
    tarballPath: state.tarballPath,
    sha: state.sha,
    repo: REPO_NAME,
  })

  const tempDir = resolve(state.input.dir + ".staging." + randomUUID())
  if (existsSync(tempDir)) {
    // UUID v4 collision — virtually impossible, but be safe.
    rmSync(tempDir, { recursive: true, force: true })
  }
  mkdirSync(tempDir, { recursive: true })

  await extractTarball({
    tarballPath: state.tarballPath,
    tempDir,
    sha: state.sha,
    repo: REPO_NAME,
  })
  state.tempDir = tempDir
}

// 4. Rename the staged package.json in place, then publish the directory
// atomically. After this step the project is on disk at `dir`.
const publishProject = async (state: RunState): Promise<void> => {
  if (!state.tempDir || !state.sha) {
    throw internal("validateAndStage did not populate tempDir/sha")
  }
  state.packageName = renameRootPackage({
    tempDir: state.tempDir,
    newName: state.input.projectName,
  })
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
}

// 5a. Skip-install path.
const buildNoInstallResult = (state: RunState): CreateResult => {
  if (!state.sha || !state.packageName) {
    throw internal("publishProject did not populate sha/packageName")
  }
  return {
    ok: true,
    mode: "create",
    projectCreated: true,
    installed: false,
    source: buildSource(state.sha) as ResultSourceMaybeSha & { sha: string },
    destination: state.input.dir,
    packageName: state.packageName,
    packageManager: "pnpm",
    recovery: recoveryCommand({ manager: pnpm, cwd: state.input.dir }),
  }
}

// 5b. Run install, return success / install-failure.
const runInstallAndBuildResult = async (
  state: RunState,
): Promise<CreateResult> => {
  if (!state.sha || !state.packageName) {
    throw internal("publishProject did not populate sha/packageName")
  }
  const installResult = await runInstall({
    manager: pnpm,
    cwd: state.input.dir,
  })

  if (installResult.ok) {
    return {
      ok: true,
      mode: "create",
      projectCreated: true,
      installed: true,
      source: buildSource(state.sha) as ResultSourceMaybeSha & { sha: string },
      destination: state.input.dir,
      packageName: state.packageName,
      packageManager: "pnpm",
      recovery: null,
    }
  }

  // Install failed. Project is on disk; surface as install-failure. The
  // install log is mirrored to stderr in src/index.ts and the captured
  // output is included in the JSON for scripts.
  const failure: CreateInstallFailure = {
    ok: false,
    mode: "create",
    projectCreated: true,
    installed: false,
    source: buildSource(state.sha),
    destination: state.input.dir,
    error: {
      code: "install_failed",
      message: `pnpm install exited with code ${installResult.code}`,
      hint: "inspect the install log on stderr, then run the recovery command below",
    },
    recovery: recoveryCommand({ manager: pnpm, cwd: state.input.dir }),
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
  const state: RunState = { input }

  try {
    guardInvocationAndArgs(input)
    await fetchSource(state)
    await validateAndStage(state)
    await publishProject(state)

    if (!input.install) {
      return buildNoInstallResult(state)
    }
    return await runInstallAndBuildResult(state)
  } catch (err) {
    cleanupState(state)

    if (err instanceof CliError) {
      const failure: CreateFailure = {
        ok: false,
        mode: "create",
        projectCreated: false,
        source: buildSource(state.sha),
        error: { code: err.code, message: err.message, hint: err.hint },
      }
      return failure
    }
    throw internal(err instanceof Error ? err.message : String(err))
  }
}
