import { readFile, lstat, realpath } from "node:fs/promises"
import { resolve, join, relative, isAbsolute, sep } from "node:path"
import { fromAsyncThrowable } from "@deessejs/fp"
import { parseProjectConfig } from "@workspace/registry/v1"
import { PackageManifestSchema } from "./add-types.js"

export async function resolveAddTarget(cwd: string, id: string) {
  const config = await readTargetConfig(cwd)
  const target = config.packageTargets?.[id]
  if (!target) throw new Error(`Target "${id}" is not declared in deesse.json.`)
  const root = await resolveTargetRoot(cwd, id, target.root)
  const path = join(root, "package.json")
  const manifest = await readTargetManifest(path, id)
  return { root, path, manifest }
}

async function readTargetConfig(cwd: string) {
  const raw: unknown = JSON.parse(
    await readFile(join(cwd, "deesse.json"), "utf8")
  )
  const parsed = parseProjectConfig(raw)
  if (!parsed.success)
    throw new Error(parsed.diagnostics.map((item) => item.message).join("\n"))
  return parsed.data
}

async function resolveTargetRoot(
  cwd: string,
  id: string,
  targetRoot: string
): Promise<string> {
  const root = resolve(cwd, targetRoot)
  if (!isPathInside(cwd, root))
    throw new Error("Package target escapes the project root.")
  const canonicalResult = await fromAsyncThrowable(() => realpath(root))
  const canonicalRoot = canonicalResult.match({
    ok: (path) => path,
    err: () => {
      throw new Error(`Target ${id} directory does not exist.`)
    },
  })
  const canonicalProject = await realpath(cwd)
  if (!isPathInside(canonicalProject, canonicalRoot))
    throw new Error(`Target ${id} resolves outside the project root.`)
  return root
}

async function readTargetManifest(path: string, id: string) {
  const manifestResult = await fromAsyncThrowable(() => lstat(path))
  if (manifestResult.isErr())
    throw new Error(`Target ${id} has no package.json.`)
  return PackageManifestSchema.parse(JSON.parse(await readFile(path, "utf8")))
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
