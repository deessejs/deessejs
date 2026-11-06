import { subset } from "semver"
import { fromAsyncThrowable, fromThrowable } from "@deessejs/fp"
import { readFile, lstat, readdir } from "node:fs/promises"
import { join, resolve, relative, isAbsolute, sep } from "node:path"
import type { PackageManagerInfo } from "./detect-pm.js"
import {
  PackageManifestSchema,
  type AddWrite,
  type BlockOutputPackage,
  type BlockOutputPath,
  type BlockOutputReference,
  type BlockState,
  type CreateAddPlanArgs,
  type CreateAddPlanResult,
  type EnvironmentDeclaration,
  type PlannedBlockFile,
  type PackageManifest,
} from "./add-types.js"
const exists = async (path: string) => {
  const result = await fromAsyncThrowable(() => lstat(path))
  return result.isOk()
}
const isPathInside = (parent: string, candidate: string): boolean => {
  const path = relative(parent, candidate)
  return (
    path === "" ||
    (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path))
  )
}
export const semverRangeSatisfies = (
  current: string,
  requested: string
): boolean => {
  if (current === requested) return true
  if (
    current.startsWith("workspace:") ||
    requested.startsWith("workspace:") ||
    current.startsWith("catalog:") ||
    requested.startsWith("catalog:")
  )
    return false
  return fromThrowable({
    onSuccess: () => subset(current, requested, { includePrerelease: true }),
    onError: () => null,
  }).match({
    ok: (satisfies) => satisfies === true,
    err: () => false,
  })
}

function addDependencies(
  target: PackageManifest,
  requested: Record<string, string>
): PackageManifest {
  const next = structuredClone(target)
  const dependencies = { ...target.dependencies }
  for (const [name, range] of Object.entries(requested)) {
    const current =
      dependencies[name] ??
      target.devDependencies?.[name] ??
      target.optionalDependencies?.[name]
    if (current && !semverRangeSatisfies(current, range))
      throw new Error(
        `Dependency conflict for ${name}: ${current} does not satisfy ${range}.`
      )
    if (!current) dependencies[name] = range
  }
  if (Object.keys(dependencies).length) next.dependencies = dependencies
  return next
}

async function validatePrerequisites(
  cwd: string,
  packageManager: PackageManagerInfo,
  manifests: PackageManifest[]
): Promise<void> {
  const workspaceFile = join(cwd, "pnpm-workspace.yaml")
  const workspaceResult = await fromAsyncThrowable(() =>
    readFile(workspaceFile, "utf8")
  )
  const workspace = workspaceResult.match({
    ok: (contents) => contents,
    err: () => "",
  })
  const catalogSection =
    /^catalog:\s*\n((?:[ \t].*\n)*)/m.exec(workspace)?.[1] ?? ""
  const missing: string[] = []
  if (
    manifests.some((manifest) => manifest.name === "@workspace/cache") &&
    !workspace.includes('"packages/*"') &&
    !workspace.includes("packages/*")
  )
    missing.push("pnpm workspace package glob packages/* for packages/cache")
  for (const manifest of manifests) {
    for (const [name, range] of Object.entries({
      ...manifest.dependencies,
      ...manifest.devDependencies,
    })) {
      if (
        range.startsWith("workspace:") &&
        (packageManager.pm === "npm" || !(await hasWorkspacePackage(cwd, name)))
      )
        missing.push(`workspace package ${name}`)
      if (
        range === "catalog:" &&
        (packageManager.pm !== "pnpm" || !catalogSection.includes(`${name}:`))
      )
        missing.push(`pnpm catalog entry ${name}`)
    }
  }
  if (missing.length)
    throw new Error(
      `Missing block prerequisites: ${[...new Set(missing)].join(", ")}.`
    )
}

async function hasWorkspacePackage(
  cwd: string,
  name: string
): Promise<boolean> {
  for (const root of ["packages", "apps"]) {
    const directoriesResult = await fromAsyncThrowable(() =>
      readdir(join(cwd, root), { withFileTypes: true })
    )
    const directories = directoriesResult.match({
      ok: (entries) => entries,
      err: () => [],
    })
    for (const directory of directories) {
      if (!directory.isDirectory()) continue
      const manifestResult = await fromAsyncThrowable(() =>
        readFile(join(cwd, root, directory.name, "package.json"), "utf8")
      )
      const manifest = manifestResult.match({
        ok: (contents) => contents,
        err: () => "",
      })
      if (!manifest) continue
      const parsed = fromThrowable({
        onSuccess: () => PackageManifestSchema.parse(JSON.parse(manifest)),
        onError: () => null,
      })
      if (parsed.match({ ok: (item) => item.name === name, err: () => false }))
        return true
    }
  }
  return false
}

export async function createAddPlan(
  args: CreateAddPlanArgs
): Promise<CreateAddPlanResult> {
  const { cwd, descriptor, files } = args
  if (
    isAlreadyInstalled(
      args.state,
      descriptor.name,
      args.identity,
      args.revision,
      args.targetId
    )
  )
    return { writes: [], manualSteps: [] }
  const manifests = parseOutputManifests(descriptor.install.packages, files)
  await validatePrerequisites(cwd, args.packageManager, manifests)
  validateUpstashProfile(
    descriptor.name,
    descriptor.install.packages,
    manifests
  )
  const dependencies = collectDependencies(manifests, args.packageManager)
  const nextTarget = addDependencies(args.targetManifest, dependencies)
  const writes = await planFiles(cwd, descriptor.install.packages, files)
  if (JSON.stringify(args.targetManifest) !== JSON.stringify(nextTarget))
    writes.push({
      path: args.targetPath,
      previous: new TextEncoder().encode(
        await readFile(args.targetPath, "utf8")
      ),
      contents: new TextEncoder().encode(
        `${JSON.stringify(nextTarget, null, 2)}\n`
      ),
    })
  const environment = [...(descriptor.install.environment ?? [])]
  if (descriptor.name === "upstash-redis") {
    for (const name of ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]) {
      if (!environment.some((item) => item.name === name))
        environment.push({
          name,
          required: true,
          secret: name.endsWith("TOKEN"),
        })
    }
  }
  await planEnvironment(cwd, environment, writes)
  const nextState = {
    version: 1 as const,
    installations: [
      ...args.state.installations,
      {
        name: descriptor.name,
        identity: args.identity,
        revision: args.revision,
        target: args.targetId,
      },
    ],
  }
  const stateExists = await exists(args.statePath)
  writes.push({
    path: args.statePath,
    ...(stateExists
      ? {
          previous: new TextEncoder().encode(
            await readFile(args.statePath, "utf8")
          ),
        }
      : {}),
    contents: new TextEncoder().encode(
      `${JSON.stringify(nextState, null, 2)}\n`
    ),
  })
  return { writes, manualSteps: descriptor.install.manualSteps ?? [] }
}

function validateUpstashProfile(
  name: string,
  packages: BlockOutputPath[],
  manifests: PackageManifest[]
): void {
  if (name !== "upstash-redis") return
  const cache = packages.find((item) => item.path === "packages/cache")
  if (!cache || !manifests.some((item) => item.name === "@workspace/cache"))
    throw new Error(
      "The upstash-redis pilot must output @workspace/cache at packages/cache."
    )
}

function isAlreadyInstalled(
  state: BlockState,
  name: string,
  identity: string,
  revision: string,
  target: string
): boolean {
  const installed = state.installations.find(
    (row) =>
      row.name === name && row.identity === identity && row.target === target
  )
  if (!installed) return false
  if (installed.revision === revision) return true
  throw new Error(
    "A different revision is already installed. `add` does not update blocks."
  )
}

function collectDependencies(
  manifests: PackageManifest[],
  manager: PackageManagerInfo
): Record<string, string> {
  const dependencies: Record<string, string> = {}
  for (const manifest of manifests) {
    dependencies[manifest.name] = manager.pm === "npm" ? "*" : "workspace:*"
  }
  return dependencies
}

async function planFiles(
  cwd: string,
  packages: BlockOutputPackage[],
  files: PlannedBlockFile[]
): Promise<AddWrite[]> {
  const writes: AddWrite[] = []
  for (const file of files) {
    const output = packages.find((item) => item.id === file.to.package)
    if (!output) throw new Error(`Unknown block output ${file.to.package}.`)
    const path = resolve(cwd, output.path, file.to.path)
    if (!isPathInside(cwd, path))
      throw new Error(`Unsafe block path ${output.path}/${file.to.path}.`)
    if (await exists(path))
      throw new Error(
        `File conflict at ${relative(cwd, path)}. Existing files are preserved.`
      )
    writes.push({ path, contents: new TextEncoder().encode(file.contents) })
  }
  return writes
}

function parseOutputManifests(
  packages: BlockOutputReference[],
  files: PlannedBlockFile[]
): PackageManifest[] {
  return packages.map((output) => {
    const source = files.find(
      (file) => file.to.package === output.id && file.to.path === "package.json"
    )
    if (!source)
      throw new Error(`Block output ${output.id} has no package.json mapping.`)
    return PackageManifestSchema.parse(JSON.parse(source.contents))
  })
}

async function planEnvironment(
  cwd: string,
  entries: EnvironmentDeclaration[],
  writes: AddWrite[]
): Promise<void> {
  if (!entries.length) return
  const path = join(cwd, ".env.example")
  const beforeResult = await fromAsyncThrowable(() => readFile(path, "utf8"))
  const before = beforeResult.match({
    ok: (contents) => contents,
    err: () => "",
  })
  let after = before
  for (const entry of entries) {
    if (!new RegExp(`^\\s*(?:export\\s+)?${entry.name}=`, "m").test(after))
      after += `${after && !after.endsWith("\n") ? "\n" : ""}${entry.name}=\n`
  }
  if (before !== after)
    writes.push({
      path,
      ...((await exists(path))
        ? { previous: new TextEncoder().encode(before) }
        : {}),
      contents: new TextEncoder().encode(after),
    })
}
