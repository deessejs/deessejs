import { lstat, mkdir, open, readdir, rmdir, unlink } from "node:fs/promises"
import { dirname, join, parse, relative, resolve, sep } from "node:path"
import type { TemplateInstallationPlan } from "@workspace/registry/v1"

import {
  CliError,
  invalidTarget,
  materializeFailed,
  targetExists,
  targetNotEmpty,
} from "../errors/index.js"

type TrackedPath = {
  path: string
  dev: number
  ino: number
}

type TargetState = {
  existed: boolean
}

type MaterializeOptions = {
  force?: boolean
}

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT"
}

function isExistsPathError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "EEXIST"
}

function getSafeRelativePath(path: string): string[] | null {
  if (
    path.length === 0 ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("\0") ||
    /^[a-z]:/i.test(path)
  ) {
    return null
  }

  const segments = path.split("/")
  if (
    segments.some(
      (segment) => segment.length === 0 || segment === "." || segment === ".."
    )
  ) {
    return null
  }

  if (
    process.platform === "win32" &&
    segments.some(
      (segment) =>
        /[<>:"|?*]/.test(segment) ||
        segment.split("").some((character) => {
          const code = character.charCodeAt(0)
          return code < 0x20 || code === 0x7f
        }) ||
        /[. ]$/.test(segment) ||
        /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment)
    )
  ) {
    return null
  }

  return segments
}

function validatePlannedPaths(
  plan: TemplateInstallationPlan,
  target: string
): void {
  if (plan.files.length === 0) {
    throw invalidTarget(target, "the template plan contains no files")
  }

  const files = new Set<string>()
  const directories = new Set<string>()
  const pathKey = (value: string): string =>
    process.platform === "win32" ? value.toLowerCase() : value

  for (const file of plan.files) {
    const segments = getSafeRelativePath(file.path)
    if (!segments || !(file.contents instanceof Uint8Array)) {
      throw invalidTarget(
        target,
        `unsafe file entry "${file.path}" in the template plan`
      )
    }

    const relativePath = segments.join(sep)
    const outputPath = resolve(target, relativePath)
    const outputRelativePath = relative(target, outputPath)
    if (
      outputRelativePath === ".." ||
      outputRelativePath.startsWith(`..${sep}`) ||
      parse(outputRelativePath).root.length > 0
    ) {
      throw invalidTarget(
        target,
        `file entry "${file.path}" escapes the target directory`
      )
    }

    const key = pathKey(relativePath)
    if (files.has(key) || directories.has(key)) {
      throw invalidTarget(
        target,
        `multiple template entries collide at "${file.path}"`
      )
    }
    files.add(key)

    let parent = ""
    for (const segment of segments.slice(0, -1)) {
      parent = parent ? join(parent, segment) : segment
      const parentKey = pathKey(parent)
      if (files.has(parentKey)) {
        throw invalidTarget(
          target,
          `file and directory entries collide at "${parent}"`
        )
      }
      directories.add(parentKey)
    }
  }

  for (const directory of directories) {
    if (files.has(directory)) {
      throw invalidTarget(
        target,
        `file and directory entries collide at "${directory}"`
      )
    }
  }
}

async function assertExistingParentsAreDirectories(
  target: string
): Promise<void> {
  const root = parse(target).root
  const segments = relative(root, dirname(target)).split(sep).filter(Boolean)
  let current = root

  for (const segment of segments) {
    current = join(current, segment)
    try {
      const details = await lstat(current)
      if (details.isSymbolicLink() || !details.isDirectory()) {
        throw invalidTarget(
          target,
          `parent path "${current}" is not a regular directory`
        )
      }
    } catch (error) {
      if (error instanceof CliError) throw error
      if (isMissingPathError(error)) return
      throw error
    }
  }
}

async function inspectTarget(
  target: string,
  force: boolean
): Promise<TargetState> {
  await assertExistingParentsAreDirectories(target)

  try {
    const details = await lstat(target)
    if (details.isSymbolicLink() || !details.isDirectory()) {
      throw invalidTarget(
        target,
        "the target must be a regular directory, not a file or symbolic link"
      )
    }
    if (!force) throw targetExists(target)
    if ((await readdir(target)).length > 0) throw targetNotEmpty(target)
    return { existed: true }
  } catch (error) {
    if (error instanceof CliError) throw error
    if (isMissingPathError(error)) return { existed: false }
    throw error
  }
}

async function trackDirectory(
  path: string,
  createdDirectories: TrackedPath[]
): Promise<void> {
  const details = await lstat(path)
  if (details.isSymbolicLink() || !details.isDirectory()) {
    throw invalidTarget(
      path,
      "a directory path was replaced or is not a regular directory"
    )
  }
  createdDirectories.push({ path, dev: details.dev, ino: details.ino })
}

function isTrackedDirectory(
  path: string,
  details: Awaited<ReturnType<typeof lstat>>,
  createdDirectories: TrackedPath[]
): boolean {
  return createdDirectories.some(
    (directory) =>
      directory.path === path &&
      directory.dev === details.dev &&
      directory.ino === details.ino
  )
}

async function ensureDirectoryHierarchy(
  directory: string,
  target: string,
  targetState: TargetState,
  createdDirectories: TrackedPath[]
): Promise<void> {
  const root = parse(directory).root
  const segments = relative(root, directory).split(sep).filter(Boolean)
  let current = root

  for (const segment of segments) {
    current = join(current, segment)
    let details
    try {
      details = await lstat(current)
    } catch (error) {
      if (!isMissingPathError(error)) throw error
      try {
        await mkdir(current)
        await trackDirectory(current, createdDirectories)
        continue
      } catch (mkdirError) {
        if (!isExistsPathError(mkdirError)) throw mkdirError
        details = await lstat(current)
      }
    }

    if (details.isSymbolicLink() || !details.isDirectory()) {
      throw invalidTarget(
        target,
        `path component "${current}" is not a regular directory`
      )
    }
    if (
      current === target &&
      !targetState.existed &&
      !isTrackedDirectory(current, details, createdDirectories)
    ) {
      throw targetExists(target)
    }
  }
}

async function cleanupCreatedPaths(
  createdFiles: TrackedPath[],
  createdDirectories: TrackedPath[]
): Promise<void> {
  for (const file of [...createdFiles].reverse()) {
    try {
      const details = await lstat(file.path)
      if (
        details.isFile() &&
        !details.isSymbolicLink() &&
        details.dev === file.dev &&
        details.ino === file.ino
      ) {
        await unlink(file.path)
      }
    } catch {
      // Cleanup is best-effort. Never replace the original write failure.
    }
  }

  for (const directory of [...createdDirectories].reverse()) {
    try {
      const details = await lstat(directory.path)
      if (
        details.isDirectory() &&
        !details.isSymbolicLink() &&
        details.dev === directory.dev &&
        details.ino === directory.ino
      ) {
        await rmdir(directory.path)
      }
    } catch {
      // rmdir removes only empty directories, so user content is preserved.
    }
  }
}

/**
 * Create the files described by a validated template plan.
 *
 * Existing destinations are rejected by default. With `force`, an existing
 * empty directory is accepted; its contents are never removed or replaced.
 */
export async function materializeTemplatePlan(
  plan: TemplateInstallationPlan,
  targetDirectory: string,
  options: MaterializeOptions = {}
): Promise<void> {
  const target = resolve(targetDirectory)
  const createdFiles: TrackedPath[] = []
  const createdDirectories: TrackedPath[] = []

  try {
    validatePlannedPaths(plan, target)
    const targetState = await inspectTarget(target, options.force ?? false)
    await ensureDirectoryHierarchy(
      target,
      target,
      targetState,
      createdDirectories
    )

    for (const file of plan.files) {
      const segments = getSafeRelativePath(file.path)
      if (!segments)
        throw invalidTarget(target, `unsafe file path "${file.path}"`)
      const outputPath = resolve(target, ...segments)
      const parentDirectory = dirname(outputPath)
      await ensureDirectoryHierarchy(
        parentDirectory,
        target,
        targetState,
        createdDirectories
      )

      const handle = await open(outputPath, "wx")
      try {
        const details = await handle.stat()
        createdFiles.push({
          path: outputPath,
          dev: details.dev,
          ino: details.ino,
        })
        await handle.writeFile(file.contents)
      } finally {
        await handle.close()
      }
    }
  } catch (error) {
    await cleanupCreatedPaths(createdFiles, createdDirectories)
    if (error instanceof CliError) throw error
    throw materializeFailed(
      target,
      error instanceof Error ? error.message : String(error)
    )
  }
}
