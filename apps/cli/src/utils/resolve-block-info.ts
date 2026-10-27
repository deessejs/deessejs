import { lstat, readFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import {
  parseBlockDescriptor,
  type BlockDescriptorV1,
} from "@workspace/registry/v1"

import {
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

type GitHubRepositoryResponse = {
  default_branch?: unknown
}

type GitHubCommitResponse = {
  sha?: unknown
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
    if (segments[2] !== "tree" || !segments[3]) return null
    urlRef = segments[3]
    path = segments.slice(4).join("/")
    if (path && !isSafeRelativePath(path)) return null
  }

  return {
    owner,
    repo,
    path,
    ...(refOverride ?? urlRef ? { ref: refOverride ?? urlRef } : {}),
  }
}


async function fetchJson<T>(
  url: string,
  source: string,
  repositoryLookup = false
): Promise<T> {
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
    throw networkError(
      error instanceof Error ? error.message : String(error)
    )
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
    return (await response.json()) as T
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
    throw networkError(
      error instanceof Error ? error.message : String(error)
    )
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

  const text = await response.text()
  if (Buffer.byteLength(text, "utf8") > MAX_BLOCK_JSON_BYTES) {
    throw blockInvalid(
      sourceLabel,
      `source file "${filePath}" exceeds the ${MAX_BLOCK_JSON_BYTES} byte limit`
    )
  }
  return text
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
  const repoInfo = await fetchJson<GitHubRepositoryResponse>(
    apiRepository,
    repository,
    true
  )
  const defaultBranch =
    typeof repoInfo.default_branch === "string" ? repoInfo.default_branch : ""
  const requestedRef = parsed.ref ?? defaultBranch
  if (!requestedRef) {
    throw blockInvalid(input, "GitHub did not report a default branch")
  }

  const commit = await fetchJson<GitHubCommitResponse>(
    `${apiRepository}/commits/${encodeURIComponent(requestedRef)}`,
    input
  )
  if (typeof commit.sha !== "string" || !/^[a-f0-9]{40}$/i.test(commit.sha)) {
    throw networkError("GitHub returned an invalid commit response.")
  }

  const source: BlockInfoSource = {
    type: "github",
    repository,
    path: parsed.path || ".",
    revision: commit.sha,
  }
  return {
    source,
    read: (path) =>
      fetchRawFile(repository, commit.sha as string, parsed.path, path, input),
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
      throw blockInvalid(label, `source file "${path}" traverses a symbolic link`)
    }
    const isLast = index === segments.length - 1
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

async function createLocalBlockReader(input: string): Promise<BlockSourceReader> {
  const root = resolve(input)
  let entry
  try {
    entry = await lstat(root)
  } catch {
    throw blockInvalid(input, "local block directory was not found")
  }
  if (!entry.isDirectory() || entry.isSymbolicLink()) {
    throw blockInvalid(input, "local block source must be a directory, not a symlink")
  }

  return {
    source: { type: "local", path: root },
    read: (path) => readSafeLocalFile(root, path, input),
  }
}

function parseJson(text: string, path: string, source: string): unknown {
  try {
    return JSON.parse(text) as unknown
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

  const entries = Object.entries(value)
  if (entries.some(([, version]) => typeof version !== "string")) {
    throw blockInvalid(source, `package.json "${field}" values must be strings`)
  }
  return Object.fromEntries(entries) as Record<string, string>
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
      reader.source.type === "local" ? reader.source.path : reader.source.repository,
      `package "${id}" does not map a package.json asset`
    )
  }

  const source = reader.source.type === "local" ? reader.source.path : reader.source.repository
  const manifest = parseJson(
    await reader.read(packageManifest.from),
    packageManifest.from,
    source
  )
  if (!isRecord(manifest) || typeof manifest.name !== "string" || !manifest.name) {
    throw blockInvalid(source, `"${packageManifest.from}" must declare a package name`)
  }
  if (manifest.version !== undefined && typeof manifest.version !== "string") {
    throw blockInvalid(source, `"${packageManifest.from}" has an invalid version`)
  }

  return {
    id,
    path,
    name: manifest.name,
    ...(typeof manifest.version === "string" ? { version: manifest.version } : {}),
    dependencies: readDependencyMap(manifest.dependencies, "dependencies", source),
    devDependencies: readDependencyMap(
      manifest.devDependencies,
      "devDependencies",
      source
    ),
  }
}

export async function resolveBlockDescriptorInfo(
  input: string,
  options: { ref?: string } = {}
): Promise<BlockDescriptorInfo> {
  const reader = looksLikeUrl(input)
    ? await createGitHubBlockReader(input, options.ref)
    : await createLocalBlockReader(input)

  const descriptorText = await reader.read("deesse-block.json")
  const descriptorValue = parseJson(descriptorText, "deesse-block.json", input)
  const result = parseBlockDescriptor(descriptorValue)
  if (!result.success) {
    const detail = result.diagnostics
      .map((diagnostic) => {
        const path = diagnostic.path.length ? ` at ${diagnostic.path.join(".")}` : ""
        return `${diagnostic.code}${path}: ${diagnostic.message}`
      })
      .join("\n")
    throw blockInvalid(input, detail)
  }

  const packages = await Promise.all(
    result.data.install.packages.map((output) =>
      readPackageInfo(reader, result.data, output.id, output.path)
    )
  )

  return {
    descriptor: result.data,
    source: reader.source,
    packages,
  }
}
