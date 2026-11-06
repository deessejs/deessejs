import {
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
  realpath,
} from "node:fs/promises"
import { dirname, relative, isAbsolute, sep } from "node:path"
import type { AddWrite } from "./add-types.js"

function isPathInside(parent: string, candidate: string): boolean {
  const path = relative(parent, candidate)
  return (
    path === "" ||
    (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path))
  )
}

export async function applyAddPlan(
  cwd: string,
  writes: AddWrite[]
): Promise<void> {
  const staged: Array<{ write: AddWrite; temporary: string; backup?: string }> =
    []
  try {
    for (const [index, write] of writes.entries()) {
      await validatePrecondition(cwd, write)
      await mkdir(dirname(write.path), { recursive: true })
      const temporary = `${write.path}.deesse-${process.pid}-${index}.tmp`
      await writeFile(temporary, write.contents, { flag: "wx" })
      staged.push(await stageWrite(write, temporary, index))
    }
    for (const item of staged) await rename(item.temporary, item.write.path)
    for (const item of staged)
      if (item.backup)
        await rm(item.backup, { force: true }).catch(() => undefined)
  } catch (error) {
    for (const item of staged.reverse()) {
      await rm(item.write.path, { force: true })
      if (item.backup) await rename(item.backup, item.write.path)
      await rm(item.temporary, { force: true })
    }
    throw error
  }
}

async function validatePrecondition(
  cwd: string,
  write: AddWrite
): Promise<void> {
  await validateParentPath(cwd, dirname(write.path))
  const current = await readFile(write.path).catch(() => undefined)
  if (
    write.previous &&
    (!current || !Buffer.from(current).equals(Buffer.from(write.previous)))
  )
    throw new Error(`Precondition changed: ${relative(cwd, write.path)}.`)
  if (!write.previous && current)
    throw new Error(
      `Precondition changed: ${relative(cwd, write.path)} now exists.`
    )
}

async function validateParentPath(cwd: string, parent: string): Promise<void> {
  const canonicalRoot = await realpath(cwd)
  let current = parent
  while (current !== cwd && isPathInside(cwd, current)) {
    try {
      const canonical = await realpath(current)
      if (
        canonical !== canonicalRoot &&
        !isPathInside(canonicalRoot, canonical)
      )
        throw new Error(
          `Unsafe symlinked output directory: ${relative(cwd, current)}.`
        )
      return
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Unsafe symlinked")
      )
        throw error
      const next = dirname(current)
      if (next === current) break
      current = next
    }
  }
}

async function stageWrite(
  write: AddWrite,
  temporary: string,
  index: number
): Promise<{ write: AddWrite; temporary: string; backup?: string }> {
  if (!write.previous) return { write, temporary }
  const backup = `${write.path}.deesse-${process.pid}-${index}.bak`
  await rename(write.path, backup)
  return { write, temporary, backup }
}
