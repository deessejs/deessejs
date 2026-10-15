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

export const run = async (opts: {
  projectName: string
  dir: string
  install: boolean
}): Promise<CreateResult> => {
  // Step 1: npm-invocation guard. Runs first, before any FS or network
  // side-effect, so npm users see the error without us touching disk.
  assertNotNpmInvocation()

  // Step 2: name + destination validation.
  validateProjectName(opts.projectName)
  validateDestination(opts.dir)

  // Step 3: resolve SHA + download tarball.
  let sha: string | undefined
  let tarballPath: string | undefined
  let tempDir: string | undefined

  try {
    sha = await resolveTemplateSha({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: REPO_REF,
    })
    const tarball = await downloadTarball({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      sha,
    })
    tarballPath = tarball.path

    // Step 4: validate + extract.
    await validateEntries({
      tarballPath,
      sha,
      repo: REPO_NAME,
    })

    tempDir = resolve(opts.dir + ".staging." + randomUUID())
    if (existsSync(tempDir)) {
      // Should be unreachable (UUID v4 collision), but be safe.
      rmSync(tempDir, { recursive: true, force: true })
    }
    mkdirSync(tempDir, { recursive: true })

    await extractTarball({
      tarballPath,
      tempDir,
      sha,
      repo: REPO_NAME,
    })

    // Step 5: rename package.json in temp dir (atomic, before publish).
    const renamed = renameRootPackage({
      tempDir,
      newName: opts.projectName,
    })

    // Step 6: atomic publish (rename tempDir -> destination).
    await publishOrRollback({
      tempDir,
      destination: opts.dir,
      tarballPath,
    })
    tempDir = undefined // ownership transferred

    // Step 7: install (unless --no-install).
    if (!opts.install) {
      const recovery = recoveryCommand({ manager: pnpm, cwd: opts.dir })
      return {
        ok: true,
        mode: "create",
        projectCreated: true,
        installed: false,
        source: buildSource(sha) as ResultSourceMaybeSha & { sha: string },
        destination: opts.dir,
        packageName: renamed,
        packageManager: "pnpm",
        recovery,
      }
    }

    const installResult = await runInstall({ manager: pnpm, cwd: opts.dir })
    if (installResult.ok) {
      return {
        ok: true,
        mode: "create",
        projectCreated: true,
        installed: true,
        source: buildSource(sha) as ResultSourceMaybeSha & { sha: string },
        destination: opts.dir,
        packageName: renamed,
        packageManager: "pnpm",
        recovery: null,
      }
    }

    // Install failed. Project is on disk; surface as install-failure.
    // The install log is mirrored to stderr (in the caller) and the
    // captured output is included in the JSON for scripts.
    const recovery = recoveryCommand({ manager: pnpm, cwd: opts.dir })
    const installOutput = {
      code: installResult.code,
      stderr: installResult.stderr,
      stdout: installResult.stdout,
    }
    const failure: CreateInstallFailure = {
      ok: false,
      mode: "create",
      projectCreated: true,
      installed: false,
      source: buildSource(sha),
      destination: opts.dir,
      error: {
        code: "install_failed",
        message: `pnpm install exited with code ${installResult.code}`,
        hint: "inspect the install log on stderr, then run the recovery command below",
      },
      recovery,
      installOutput,
    }
    return failure
  } catch (err) {
    // Rollback any partial FS state.
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
    if (tarballPath && existsSync(tarballPath)) {
      rmSync(tarballPath, { force: true })
    }

    if (err instanceof CliError) {
      const failure: CreateFailure = {
        ok: false,
        mode: "create",
        projectCreated: false,
        source: buildSource(sha),
        error: { code: err.code, message: err.message, hint: err.hint },
      }
      return failure
    }
    throw internal(err instanceof Error ? err.message : String(err))
  }
}
