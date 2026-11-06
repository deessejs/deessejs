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
  const workspace = await readWorkspaceConfig(cwd)
  const missing = await collectMissingPrerequisites(
    cwd,
    packageManager,
    manifests,
    workspace
  )
  if (missing.length)
    throw new Error(
      `Missing block prerequisites: ${[...new Set(missing)].join(", ")}.`
    )
}

async function readWorkspaceConfig(cwd: string): Promise<string> {
  const result = await fromAsyncThrowable(() =>
    readFile(join(cwd, "pnpm-workspace.yaml"), "utf8")
  )
  return result.match({
    ok: (contents) => contents,
    err: () => "",
  })
}

async function collectMissingPrerequisites(
  cwd: string,
  packageManager: PackageManagerInfo,
  manifests: PackageManifest[],
  workspace: string
): Promise<string[]> {
  const missing = hasCacheWorkspaceGlob(workspace, manifests)
  for (const manifest of manifests)
    missing.push(
      ...(await findManifestPrerequisites(
        cwd,
        packageManager,
        manifest,
        workspace
      ))
    )
  return missing
}

function hasCacheWorkspaceGlob(
  workspace: string,
  manifests: PackageManifest[]
): string[] {
  const needsCache = manifests.some(
    (manifest) => manifest.name === "@workspace/cache"
  )
  const hasPackageGlob =
    workspace.includes('"packages/*"') || workspace.includes("packages/*")
  return needsCache && !hasPackageGlob
    ? ["pnpm workspace package glob packages/* for packages/cache"]
    : []
}

async function findManifestPrerequisites(
  cwd: string,
  packageManager: PackageManagerInfo,
  manifest: PackageManifest,
  workspace: string
): Promise<string[]> {
  const declarations = Object.entries(dependencyDeclarations(manifest))
  const missing: string[] = []
  for (const [name, range] of declarations)
    missing.push(
      ...(await findDependencyPrerequisites(
        cwd,
        packageManager,
        name,
        range,
        workspace
      ))
    )
  return missing
}

function dependencyDeclarations(
  manifest: PackageManifest
): Record<string, string> {
  return { ...manifest.dependencies, ...manifest.devDependencies }
}

async function findDependencyPrerequisites(
  cwd: string,
  packageManager: PackageManagerInfo,
  name: string,
  range: string,
  workspace: string
): Promise<string[]> {
  const missing: string[] = []
  if (
    range.startsWith("workspace:") &&
    (packageManager.pm === "npm" || !(await hasWorkspacePackage(cwd, name)))
  )
    missing.push(`workspace package ${name}`)
  if (
    range === "catalog:" &&
    (packageManager.pm !== "pnpm" || !hasCatalogEntry(workspace, name))
  )
    missing.push(`pnpm catalog entry ${name}`)
  return missing
}

function hasCatalogEntry(workspace: string, name: string): boolean {
  const catalog = /^catalog:\s*\n((?:[ \t].*\n)*)/m.exec(workspace)?.[1] ?? ""
  return catalog.includes(`${name}:`)
}

async function hasWorkspacePackage(
  cwd: string,
  name: string
): Promise<boolean> {
  for (const root of ["packages", "apps"]) {
    if (await workspaceRootHasPackage(cwd, root, name)) return true
  }
  return false
}

async function workspaceRootHasPackage(
  cwd: string,
  root: string,
  name: string
): Promise<boolean> {
  const result = await fromAsyncThrowable(() =>
    readdir(join(cwd, root), { withFileTypes: true })
  )
  const directories = result.match({ ok: (entries) => entries, err: () => [] })
  for (const directory of directories) {
    if (!directory.isDirectory()) continue
    if (await workspaceDirectoryHasPackage(cwd, root, directory.name, name))
      return true
  }
  return false
}

async function workspaceDirectoryHasPackage(
  cwd: string,
  root: string,
  directory: string,
  name: string
): Promise<boolean> {
  const path = join(cwd, root, directory, "package.json")
  const result = await fromAsyncThrowable(() => readFile(path, "utf8"))
  const contents = result.match({ ok: (text) => text, err: () => "" })
  if (!contents) return false
  return fromThrowable({
    onSuccess: () =>
      PackageManifestSchema.parse(JSON.parse(contents)).name === name,
    onError: () => false,
  }).match({ ok: Boolean, err: Boolean })
}

export async function createAddPlan(
  args: CreateAddPlanArgs
): Promise<CreateAddPlanResult> {
  const { cwd, descriptor, files } = args
  if (isAlreadyInstalled(args)) return emptyAddPlan()
  const manifests = parseOutputManifests(descriptor.install.packages, files)
  await validatePrerequisites(cwd, args.packageManager, manifests)
  validateUpstashProfile(
    descriptor.name,
    descriptor.install.packages,
    manifests
  )
  const writes = await planBlockOutputs(args, manifests)
  await planEnvironment(cwd, getEnvironmentDeclarations(args), writes)
  await planInstallationState(args, writes)
  return { writes, manualSteps: descriptor.install.manualSteps ?? [] }
}

function emptyAddPlan(): CreateAddPlanResult {
  return { writes: [], manualSteps: [] }
}

async function planBlockOutputs(
  args: CreateAddPlanArgs,
  manifests: PackageManifest[]
): Promise<AddWrite[]> {
  const { cwd, descriptor, files } = args
  const dependencies = collectDependencies(manifests, args.packageManager)
  const nextTarget = addDependencies(args.targetManifest, dependencies)
  const writes = await planFiles(cwd, descriptor.install.packages, files)
  await planTargetManifest(args, nextTarget, writes)
  return writes
}

async function planTargetManifest(
  args: CreateAddPlanArgs,
  nextTarget: PackageManifest,
  writes: AddWrite[]
): Promise<void> {
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
}

function getEnvironmentDeclarations(
  args: CreateAddPlanArgs
): EnvironmentDeclaration[] {
  const entries = [...(args.descriptor.install.environment ?? [])]
  if (args.descriptor.name !== "upstash-redis") return entries
  for (const name of ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"])
    if (!entries.some((item) => item.name === name))
      entries.push({ name, required: true, secret: name.endsWith("TOKEN") })
  return entries
}

async function planInstallationState(
  args: CreateAddPlanArgs,
  writes: AddWrite[]
): Promise<void> {
  const nextState = buildNextState(args)
  const previous = await readPreviousState(args.statePath)
  writes.push({
    path: args.statePath,
    ...(previous ? { previous } : {}),
    contents: new TextEncoder().encode(
      `${JSON.stringify(nextState, null, 2)}\n`
    ),
  })
}

function buildNextState(args: CreateAddPlanArgs) {
  return {
    version: 1 as const,
    installations: [
      ...args.state.installations,
      {
        name: args.descriptor.name,
        identity: args.identity,
        revision: args.revision,
        target: args.targetId,
      },
    ],
  }
}

async function readPreviousState(
  path: string
): Promise<Uint8Array | undefined> {
  const result = await fromAsyncThrowable(() => readFile(path, "utf8"))
  return result.match({
    ok: (contents) => new TextEncoder().encode(contents),
    err: () => undefined,
  })
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

function isAlreadyInstalled(args: CreateAddPlanArgs): boolean {
  const installed = args.state.installations.find(
    (row) =>
      row.name === args.descriptor.name &&
      row.identity === args.identity &&
      row.target === args.targetId
  )
  if (!installed) return false
  if (installed.revision === args.revision) return true
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
  const write = await buildEnvironmentWrite(cwd, entries)
  if (write) writes.push(write)
}

async function buildEnvironmentWrite(
  cwd: string,
  entries: EnvironmentDeclaration[]
): Promise<AddWrite | undefined> {
  const path = join(cwd, ".env.example")
  const before = await readEnvironmentExample(path)
  const after = appendMissingEnvironmentDeclarations(before, entries)
  if (before === after) return undefined
  const previous = (await exists(path))
    ? new TextEncoder().encode(before)
    : undefined
  return {
    path,
    ...(previous ? { previous } : {}),
    contents: new TextEncoder().encode(after),
  }
}

async function readEnvironmentExample(path: string): Promise<string> {
  const beforeResult = await fromAsyncThrowable(() => readFile(path, "utf8"))
  return beforeResult.match({
    ok: (contents) => contents,
    err: () => "",
  })
}

function appendMissingEnvironmentDeclarations(
  before: string,
  entries: EnvironmentDeclaration[]
): string {
  return entries.reduce((contents, entry) => {
    if (new RegExp(`^\\s*(?:export\\s+)?${entry.name}=`, "m").test(contents))
      return contents
    const separator = contents && !contents.endsWith("\n") ? "\n" : ""
    return `${contents}${separator}${entry.name}=\n`
  }, before)
}
