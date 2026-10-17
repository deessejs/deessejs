import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { validateProjectName } from "../name/validate.js"

export type RenameRootPackageArgs = {
  tempDir: string
  newName: string
}

export type RenameRootPackageResult = {
  previous: string
  current: string
}

const TMP_SUFFIX = ".tmp"

const readPackageJson = (dir: string): Record<string, unknown> => {
  const path = join(dir, "package.json")
  if (!existsSync(path)) {
    throw new Error(`template is missing root package.json at ${path}`)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"))
  } catch (err) {
    throw new Error(
      `template package.json is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as { name?: unknown }).name !== "string"
  ) {
    throw new Error("template package.json has no string `name` field")
  }
  return parsed as Record<string, unknown>
}

/**
 * Rewrite the root `package.json` name inside the staged temp directory.
 *
 * The rename happens INSIDE `tempDir`, not the published dir, so a write
 * failure here leaves the destination untouched (the staged dir is removed
 * by `publishOrRollback`).
 *
 * Never recurses into nested package.json files in packages subdirectories.
 * Workspace packages keep their original workspace-prefixed names.
 */
export const renameRootPackage = (
  args: RenameRootPackageArgs,
): RenameRootPackageResult => {
  const { tempDir, newName } = args
  validateProjectName(newName)

  const path = join(tempDir, "package.json")
  const pkg = readPackageJson(tempDir)
  const previousName = pkg.name as string

  if (previousName === newName) {
    return { previous: previousName, current: newName }
  }

  const updated: Record<string, unknown> = { ...pkg, name: newName }
  const serialized = JSON.stringify(updated, null, 2) + "\n"

  const tmpPath = path + TMP_SUFFIX
  writeFileSync(tmpPath, serialized, "utf8")
  renameSync(tmpPath, path)

  return { previous: previousName, current: newName }
}