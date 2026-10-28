import { lstat, readFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import {
  parseBlockDescriptor,
  type BlockDescriptorDiagnosticCode,
  type BlockDescriptorV1,
} from "@workspace/registry/v1"

import {
  CliError,
  blockInvalid,
  networkError,
  repositoryNotFound,
} from "../errors/index.js"
import { looksLikeUrl } from "./github-repository.js"

const GITHUB_API_BASE_URL = "https://api.github.com"
const MAX_BLOCK_JSON_BYTES = 1024 * 1024
const REQUEST_TIMEOUT_MS = 15_000

type GitHubBlockUrl = {
  owner: string
  repo: string
  path: string
  ref?: string
}

export type BlockInfoSource =
  | { type: "local"; path: string }
  | { type: "github"; repository: string; path: string; revision: string }

export type BlockInfoPackage = {
  id: string
  path: string
  name: string
  version?: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}

export type BlockDescriptorInfo = {
  descriptor: BlockDescriptorV1
  source: BlockInfoSource
  packages: BlockInfoPackage[]
}

export type BlockCheckDiagnostic = {
  code:
    | BlockDescriptorDiagnosticCode
    | "asset.unreadable"
    | "package_manifest.invalid"
  message: string
  path: string[]
}

export type BlockCheckResult = {
  source: BlockInfoSource
  descriptor: BlockDescriptorV1 | null
  filesDeclared: number
  filesChecked: number
  packages: BlockInfoPackage[]
  diagnostics: BlockCheckDiagnostic[]
}

type BlockSourceReader = {
  source: BlockInfoSource
  read(path: string): Promise<string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isSafeRelativePath(value: string): boolean {
  if (
    !value ||
    value.startsWith("/") ||
    /^[A-Za-z]:/.test(value) ||
    value.includes("\\") ||
    value.includes("\0")
  ) {
    return false
  }
  return value
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..")
}

function parseGitHubBlockUrl(
  input: string,
  refOverride?: string
): GitHubBlockUrl | null {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return null
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    return null
  }

  let segments: string[]
  try {
    segments = url.pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment))
  } catch {
    return null
  }

  const owner = segments[0]
  const rawRepo = segments[1]
  if (!owner || !rawRepo) return null
  const repo = rawRepo.replace(/\.git$/, "")
  if (!/^[A-Za-z0-9-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
    return null
  }

  let path = ""
  let urlRef: string | undefined
  if (segments.length > 2) {
    if (segments[2] === "tree") {
      if (!segments[3]) return null
      urlRef = segments[3]
      path = segments.slice(4).join("/")
    } else {
      path = segments.slice(2).join("/")
    }
    if (path && !isSafeRelativePath(path)) return null
  }

  const ref = refOverride ?? urlRef
  return {
    owner,
    repo,
    path,
    ...(ref ? { ref } : {}),
  }
}

async function fetchJson(
  url: string,
  source: string,
  repositoryLookup = false
): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw networkError(error instanceof Error ? error.message : String(error))
  }

  if (response.status === 404) {
    if (repositoryLookup) throw repositoryNotFound(source)
    throw blockInvalid(source, "the requested Git ref was not found")
  }
  if (!response.ok) {
    throw networkError(
      `GitHub returned HTTP ${response.status} while reading ${source}.`
    )
  }

  try {
    return await response.json()
  } catch {
    throw networkError("GitHub returned malformed JSON.")
  }
}

async function fetchRawFile(
  repository: string,
  revision: string,
  blockPath: string,
  filePath: string,
  sourceLabel: string
): Promise<string> {
  const fullPath = [blockPath, filePath].filter(Boolean).join("/")
  const rawUrl = [
    "https://raw.githubusercontent.com",
    ...repository.split("/").map(encodeURIComponent),
    encodeURIComponent(revision),
    ...(fullPath ? fullPath.split("/").map(encodeURIComponent) : []),
  ].join("/")

  let response: Response
  try {
    response = await fetch(rawUrl, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw networkError(error instanceof Error ? error.message : String(error))
  }

  if (response.status === 404) {
    throw blockInvalid(
      sourceLabel,
      `source file "${filePath}" was not found at the selected revision`
    )
  }
  if (!response.ok) {
    throw networkError(
      `GitHub returned HTTP ${response.status} while reading ${filePath}.`
    )
  }

  const contentLength = Number(response.headers.get("content-length"))
  if (Number.isFinite(contentLength) && contentLength > MAX_BLOCK_JSON_BYTES) {
    throw blockInvalid(
      sourceLabel,
      `source file "${filePath}" exceeds the ${MAX_BLOCK_JSON_BYTES} byte limit`
    )
  }
  if (!response.body) {
    throw networkError(
      `GitHub returned an empty response body for ${filePath}.`
    )
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let byteLength = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    byteLength += value.byteLength
    if (byteLength > MAX_BLOCK_JSON_BYTES) {
      await reader.cancel()
      throw blockInvalid(
        sourceLabel,
        `source file "${filePath}" exceeds the ${MAX_BLOCK_JSON_BYTES} byte limit`
      )
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString("utf8")
}

async function createGitHubBlockReader(
  input: string,
  refOverride?: string
): Promise<BlockSourceReader> {
  const parsed = parseGitHubBlockUrl(input, refOverride)
  if (!parsed) {
    throw blockInvalid(
      input,
      "expected a public HTTPS GitHub repository URL or a /tree/<ref>/<block-path> URL"
    )
  }

  const repository = `${parsed.owner}/${parsed.repo}`
  const apiRepository = `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`
  const repoPayload = await fetchJson(apiRepository, repository, true)
  const defaultBranch =
    isRecord(repoPayload) && typeof repoPayload.default_branch === "string"
      ? repoPayload.default_branch
      : ""
  const requestedRef = parsed.ref ?? defaultBranch
  if (!requestedRef) {
    throw blockInvalid(input, "GitHub did not report a default branch")
  }

  const commit = await fetchJson(
    `${apiRepository}/commits/${encodeURIComponent(requestedRef)}`,
    input
  )
  if (
    !isRecord(commit) ||
    typeof commit.sha !== "string" ||
    !/^[a-f0-9]{40}$/i.test(commit.sha)
  ) {
    throw networkError("GitHub returned an invalid commit response.")
  }
  const revision = commit.sha

  const source: BlockInfoSource = {
    type: "github",
    repository,
    path: parsed.path || ".",
    revision,
  }
  return {
    source,
    read: (path) =>
      fetchRawFile(repository, revision, parsed.path, path, input),
  }
}

async function readSafeLocalFile(root: string, path: string, label: string) {
  if (!isSafeRelativePath(path)) {
    throw blockInvalid(label, `unsafe source path "${path}"`)
  }

  let current = root
  const segments = path.split("/")
  for (const [index, segment] of segments.entries()) {
    current = join(current, segment)
    let entry
    try {
      entry = await lstat(current)
    } catch {
      throw blockInvalid(label, `source file "${path}" was not found`)
    }
    if (entry.isSymbolicLink()) {
      throw blockInvalid(
        label,
        `source file "${path}" traverses a symbolic link`
      )
    }
    const isLast = index === segments.length - 1
    if (isLast && entry.size > MAX_BLOCK_JSON_BYTES) {
      throw blockInvalid(
        label,
        `source file "${path}" exceeds the ${MAX_BLOCK_JSON_BYTES} byte limit`
      )
    }
    if ((!isLast && !entry.isDirectory()) || (isLast && !entry.isFile())) {
      throw blockInvalid(label, `source path "${path}" is not a regular file`)
    }
  }

  try {
    const contents = await readFile(current)
    if (contents.byteLength > MAX_BLOCK_JSON_BYTES) {
      throw blockInvalid(
        label,
        `source file "${path}" exceeds the ${MAX_BLOCK_JSON_BYTES} byte limit`
      )
    }
    return contents.toString("utf8")
  } catch (error) {
    if (error instanceof Error && error.name === "CliError") throw error
    throw blockInvalid(label, `source file "${path}" could not be read`)
  }
}

async function createLocalBlockReader(
  input: string
): Promise<BlockSourceReader> {
  const root = resolve(input)
  let entry
  try {
    entry = await lstat(root)
  } catch {
    throw blockInvalid(input, "local block directory was not found")
  }
  if (!entry.isDirectory() || entry.isSymbolicLink()) {
    throw blockInvalid(
      input,
      "local block source must be a directory, not a symlink"
    )
  }

  return {
    source: { type: "local", path: root },
    read: (path) => readSafeLocalFile(root, path, input),
  }
}

function parseJson(text: string, path: string, source: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    throw blockInvalid(source, `"${path}" is not valid JSON`)
  }
}

function readDependencyMap(
  value: unknown,
  field: string,
  source: string
): Record<string, string> {
  if (value === undefined) return {}
  if (!isRecord(value)) {
    throw blockInvalid(source, `package.json "${field}" must be an object`)
  }

  const dependencies: Record<string, string> = {}
  for (const [name, version] of Object.entries(value)) {
    if (typeof version !== "string") {
      throw blockInvalid(
        source,
        `package.json "${field}" values must be strings`
      )
    }
    dependencies[name] = version
  }
  return dependencies
}

function parsePackageInfo(
  manifestText: string,
  manifestPath: string,
  source: string,
  id: string,
  path: string
): BlockInfoPackage {
  const manifest = parseJson(manifestText, manifestPath, source)
  if (
    !isRecord(manifest) ||
    typeof manifest.name !== "string" ||
    !manifest.name
  ) {
    throw blockInvalid(
      source,
      '"' + manifestPath + '" must declare a package name'
    )
  }
  if (manifest.version !== undefined && typeof manifest.version !== "string") {
    throw blockInvalid(source, '"' + manifestPath + '" has an invalid version')
  }

  return {
    id,
    path,
    name: manifest.name,
    ...(typeof manifest.version === "string"
      ? { version: manifest.version }
      : {}),
    dependencies: readDependencyMap(
      manifest.dependencies,
      "dependencies",
      source
    ),
    devDependencies: readDependencyMap(
      manifest.devDependencies,
      "devDependencies",
      source
    ),
  }
}

async function readPackageInfo(
  reader: BlockSourceReader,
  descriptor: BlockDescriptorV1,
  id: string,
  path: string
): Promise<BlockInfoPackage> {
  const packageManifest = descriptor.install.files.find(
    (file) => file.to.package === id && file.to.path === "package.json"
  )
  if (!packageManifest) {
    throw blockInvalid(
      reader.source.type === "local"
        ? reader.source.path
        : reader.source.repository,
      'package "' + id + '" does not map a package.json asset'
    )
  }

  const source =
    reader.source.type === "local"
      ? reader.source.path
      : reader.source.repository
  const manifestText = await reader.read(packageManifest.from)
  return parsePackageInfo(manifestText, packageManifest.from, source, id, path)
}

function getErrorDetail(error: unknown): string {
  if (error instanceof CliError && error.hint) return error.hint
  return error instanceof Error ? error.message : String(error)
}

async function loadBlockDescriptor(
  input: string,
  options: { ref?: string }
): Promise<
  | {
      reader: BlockSourceReader
      descriptor: BlockDescriptorV1
    }
  | {
      reader: BlockSourceReader
      diagnostics: BlockCheckDiagnostic[]
    }
> {
  const isRemoteSource = looksLikeUrl(input)
  if (options.ref && !isRemoteSource) {
    throw blockInvalid(
      input,
      "--ref can only be used with a GitHub block source"
    )
  }

  const reader = isRemoteSource
    ? await createGitHubBlockReader(input, options.ref)
    : await createLocalBlockReader(input)

  const descriptorText = await reader.read("deesse-block.json")
  const descriptorValue = parseJson(descriptorText, "deesse-block.json", input)
  const result = parseBlockDescriptor(descriptorValue)
  if (!result.success) {
    return {
      reader,
      diagnostics: result.diagnostics.map((diagnostic) => ({
        code: diagnostic.code,
        message: diagnostic.message,
        path: diagnostic.path,
      })),
    }
  }

  return { reader, descriptor: result.data }
}

function formatDescriptorDiagnostics(
  diagnostics: BlockCheckDiagnostic[]
): string {
  return diagnostics
    .map((diagnostic) => {
      const path = diagnostic.path.length
        ? " at " + diagnostic.path.join(".")
        : ""
      return diagnostic.code + path + ": " + diagnostic.message
    })
    .join("\n")
}

export async function resolveBlockDescriptorInfo(
  input: string,
  options: { ref?: string } = {}
): Promise<BlockDescriptorInfo> {
  const loaded = await loadBlockDescriptor(input, options)
  if (!("descriptor" in loaded)) {
    throw blockInvalid(input, formatDescriptorDiagnostics(loaded.diagnostics))
  }

  const packages = await Promise.all(
    loaded.descriptor.install.packages.map((output) =>
      readPackageInfo(loaded.reader, loaded.descriptor, output.id, output.path)
    )
  )

  return {
    descriptor: loaded.descriptor,
    source: loaded.reader.source,
    packages,
  }
}

export async function checkBlockSource(
  input = ".",
  options: { ref?: string } = {}
): Promise<BlockCheckResult> {
  const loaded = await loadBlockDescriptor(input, options)
  if (!("descriptor" in loaded)) {
    return {
      source: loaded.reader.source,
      descriptor: null,
      filesDeclared: 0,
      filesChecked: 0,
      packages: [],
      diagnostics: loaded.diagnostics,
    }
  }

  const descriptor = loaded.descriptor
  const fileResults = await Promise.all(
    descriptor.install.files.map(async (file, index) => {
      try {
        return {
          success: true as const,
          path: file.from,
          contents: await loaded.reader.read(file.from),
        }
      } catch (error) {
        return {
          success: false as const,
          diagnostic: {
            code: "asset.unreadable" as const,
            message: getErrorDetail(error),
            path: ["install", "files", String(index), "from"],
          },
        }
      }
    })
  )
  const assetContents = new Map<string, string>()
  const diagnostics: BlockCheckDiagnostic[] = []
  for (const result of fileResults) {
    if (result.success) {
      assetContents.set(result.path, result.contents)
    } else {
      diagnostics.push(result.diagnostic)
    }
  }

  const packages: BlockInfoPackage[] = []
  for (const [index, output] of descriptor.install.packages.entries()) {
    const manifestIndex = descriptor.install.files.findIndex(
      (file) => file.to.package === output.id && file.to.path === "package.json"
    )
    const manifestFile = descriptor.install.files[manifestIndex]
    if (!manifestFile) continue

    const manifestText = assetContents.get(manifestFile.from)
    if (manifestText === undefined) continue

    const source =
      loaded.reader.source.type === "local"
        ? loaded.reader.source.path
        : loaded.reader.source.repository
    try {
      packages.push(
        parsePackageInfo(
          manifestText,
          manifestFile.from,
          source,
          output.id,
          output.path
        )
      )
    } catch (error) {
      diagnostics.push({
        code: "package_manifest.invalid",
        message: getErrorDetail(error),
        path: ["install", "packages", String(index)],
      })
    }
  }

  return {
    source: loaded.reader.source,
    descriptor,
    filesDeclared: descriptor.install.files.length,
    filesChecked: assetContents.size,
    packages,
    diagnostics,
  }
}
