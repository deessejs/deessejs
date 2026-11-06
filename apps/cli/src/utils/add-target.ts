import { readFile, lstat, realpath } from "node:fs/promises"
import { resolve, join, relative, isAbsolute, sep } from "node:path"
import { parseProjectConfig } from "@workspace/registry/v1"
import { PackageManifestSchema } from "./add-types.js"

export async function resolveAddTarget(cwd: string, id: string) {
  const raw: unknown = JSON.parse(
    await readFile(join(cwd, "deesse.json"), "utf8")
  )
  const parsed = parseProjectConfig(raw)
  if (!parsed.success)
    throw new Error(parsed.diagnostics.map((item) => item.message).join("\n"))
  const target = parsed.data.packageTargets?.[id]
  if (!target) throw new Error(`Target "${id}" is not declared in deesse.json.`)
  const root = resolve(cwd, target.root)
  if (!isPathInside(cwd, root))
    throw new Error("Package target escapes the project root.")
  const canonicalRoot = await realpath(root).catch(() => {
    throw new Error(`Target ${id} directory does not exist.`)
  })
  const canonicalProject = await realpath(cwd)
  if (!isPathInside(canonicalProject, canonicalRoot))
    throw new Error(`Target ${id} resolves outside the project root.`)
  const path = join(root, "package.json")
  try {
    await lstat(path)
  } catch {
    throw new Error(`Target ${id} has no package.json.`)
  }
  const manifest = PackageManifestSchema.parse(
    JSON.parse(await readFile(path, "utf8"))
  )
  return { root, path, manifest }
}

function isPathInside(parent: string, candidate: string) {
  const relativePath = relative(parent, candidate)
  return (
    relativePath === "" ||
    (relativePath !== ".." &&
      !relativePath.startsWith(`..${sep}`) &&
      !isAbsolute(relativePath))
  )
}
