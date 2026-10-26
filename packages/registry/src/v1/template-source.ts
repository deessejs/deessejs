import { createReadStream, createWriteStream } from "node:fs"
import { mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Readable, Transform } from "node:stream"
import { pipeline } from "node:stream/promises"
import { createGunzip } from "node:zlib"
import * as tar from "tar"

export type TemplateSourceRequest = {
  repository: string
  ref?: string
}

export type TemplateSourceEntry = {
  path: string
  mode: string
  type: "blob" | "tree" | "commit"
  sha: string
  size?: number
}

export type TemplateSourceSnapshot = {
  repository: string
  revision: string
  entries: readonly TemplateSourceEntry[]
  readFile(path: string): Promise<Uint8Array>
}

export type TemplateSourceAdapter = {
  resolve(source: TemplateSourceRequest): Promise<TemplateSourceSnapshot>
  resolveRevision(repository: string, ref: string): Promise<string>
}

export type TemplateSourceDiagnosticCode =
  | "source.invalid_repository"
  | "source.unavailable"
  | "source.invalid_response"
  | "source.incomplete_inventory"
  | "source.inventory_limit_exceeded"
  | "source.file_not_found"
  | "source.file_too_large"
  | "source.total_size_exceeded"
  | "source.file_read_failed"

export type TemplateSourceError = Error & {
  code: TemplateSourceDiagnosticCode
  path?: string
}

export function createTemplateSourceError(
  code: TemplateSourceDiagnosticCode,
  message: string,
  path?: string
): TemplateSourceError {
  return Object.assign(new Error(message), {
    name: "TemplateSourceError",
    code,
    ...(path ? { path } : {}),
  })
}

export function isTemplateSourceError(
  error: unknown
): error is TemplateSourceError {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("source.")
  )
}

export type GitHubTemplateSourceOptions = {
  fetch?: typeof fetch
  apiBaseUrl?: string
  requestTimeoutMs?: number
  retryCount?: number
  maxInventoryEntries?: number
}

const GITHUB_API_BASE_URL = "https://api.github.com"
const GITHUB_API_VERSION = "2022-11-28"
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000
const DEFAULT_RETRY_COUNT = 2
const DEFAULT_MAX_INVENTORY_ENTRIES = 10_000
const MAX_ARCHIVE_SIZE_BYTES = 100 * 1024 * 1024
const MAX_ARCHIVE_EXPANDED_SIZE_BYTES = 200 * 1024 * 1024

type GitHubCommitResponse = {
  sha?: unknown
}

type GitHubRepositoryResponse = {
  default_branch?: unknown
}

type TarEntry = {
  path: string
  type?: string
  typeflag?: string
  mode?: number
  size?: number
}

function safeArchivePath(path: string): boolean {
  if (
    !path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("\0")
  ) {
    return false
  }
  return path
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..")
}

function entryType(
  entry: TarEntry
): "file" | "directory" | "symlink" | "unsupported" {
  if (entry.type === "Directory" || entry.typeflag === "5") return "directory"
  if (entry.type === "SymbolicLink" || entry.typeflag === "2") return "symlink"
  if (
    entry.type === "File" ||
    entry.type === "OldFile" ||
    entry.typeflag === "0" ||
    entry.typeflag === "\0"
  )
    return "file"
  return "unsupported"
}

async function downloadArchive(
  response: Response,
  archivePath: string,
  maxArchiveSizeBytes: number
): Promise<void> {
  if (!response.body) {
    throw createTemplateSourceError(
      "source.invalid_response",
      "GitHub returned an empty source archive."
    )
  }

  let downloadedBytes = 0
  const limit = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      downloadedBytes += chunk.byteLength
      if (downloadedBytes > maxArchiveSizeBytes) {
        callback(
          new Error(
            `The source archive exceeds the ${maxArchiveSizeBytes} byte download limit.`
          )
        )
        return
      }
      callback(null, chunk)
    },
  })
  try {
    await pipeline(
      Readable.fromWeb(
        response.body as import("node:stream/web").ReadableStream
      ),
      limit,
      createWriteStream(archivePath, { flags: "wx" })
    )
  } catch (error) {
    if (String(error).includes("download limit")) {
      throw createTemplateSourceError(
        "source.inventory_limit_exceeded",
        String(error)
      )
    }
    throw error
  }
}

async function decompressArchive(
  archivePath: string,
  root: string
): Promise<string> {
  const tarPath = join(root, "source.tar")
  let expandedBytes = 0
  const limit = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      expandedBytes += chunk.byteLength
      if (expandedBytes > MAX_ARCHIVE_EXPANDED_SIZE_BYTES) {
        callback(
          new Error(
            `The source archive expands beyond the ${MAX_ARCHIVE_EXPANDED_SIZE_BYTES} byte limit.`
          )
        )
        return
      }
      callback(null, chunk)
    },
  })

  try {
    await pipeline(
      createReadStream(archivePath),
      createGunzip(),
      limit,
      createWriteStream(tarPath, { flags: "wx" })
    )
  } catch (error) {
    if (String(error).includes("expands beyond")) {
      throw createTemplateSourceError(
        "source.inventory_limit_exceeded",
        String(error)
      )
    }
    throw createTemplateSourceError(
      "source.invalid_response",
      `GitHub returned an invalid gzip source archive: ${String(error)}.`
    )
  }

  return tarPath
}

async function readArchiveSnapshot(
  archivePath: string,
  root: string,
  repository: string,
  revision: string,
  expectedArchiveRoot: string,
  maxInventoryEntries: number
): Promise<TemplateSourceSnapshot> {
  const entries: TemplateSourceEntry[] = []
  const archivePaths = new Set<string>()
  let archiveRoot: string | undefined
  const tarPath = await decompressArchive(archivePath, root)
  let inventoryError: TemplateSourceError | undefined
  const failInventory = (error: TemplateSourceError) => {
    inventoryError = error
  }

  await tar.t({
    file: tarPath,
    onentry: (rawEntry) => {
      if (inventoryError) return
      const entry = rawEntry as unknown as TarEntry
      const rawPath = entry.path.replace(/\/$/, "")
      const segments = rawPath.split("/")
      const currentRoot = segments[0]
      if (!currentRoot || !safeArchivePath(rawPath)) {
        failInventory(
          createTemplateSourceError(
            "source.invalid_response",
            `GitHub returned an unsafe archive path "${entry.path}".`
          )
        )
        return
      }
      if (archiveRoot === undefined) archiveRoot = currentRoot
      if (currentRoot !== archiveRoot) {
        failInventory(
          createTemplateSourceError(
            "source.invalid_response",
            `GitHub returned an archive with multiple top-level directories for ${repository}@${revision}.`
          )
        )
        return
      }
      if (currentRoot !== expectedArchiveRoot) {
        failInventory(
          createTemplateSourceError(
            "source.invalid_response",
            `GitHub returned an archive rooted at "${currentRoot}" instead of the requested ${repository}@${revision}.`
          )
        )
        return
      }
      const path = segments.slice(1).join("/")
      if (!path) return
      if (!safeArchivePath(path) || archivePaths.has(path)) {
        failInventory(
          createTemplateSourceError(
            "source.invalid_response",
            `GitHub returned an unsafe or duplicate archive path "${path}".`
          )
        )
        return
      }
      archivePaths.add(path)
      if (entries.length >= maxInventoryEntries) {
        failInventory(
          createTemplateSourceError(
            "source.inventory_limit_exceeded",
            `The source inventory exceeds the limit of ${maxInventoryEntries} entries.`
          )
        )
        return
      }

      const kind = entryType(entry)
      if (kind === "file") {
        const size = entry.size ?? 0
        entries.push({
          path,
          mode:
            entry.mode !== undefined && (entry.mode & 0o111) !== 0
              ? "100755"
              : "100644",
          type: "blob",
          sha: `${revision}:${path}`,
          size,
        })
      } else if (kind === "directory") {
        entries.push({
          path,
          mode: "040000",
          type: "tree",
          sha: `${revision}:${path}`,
        })
      } else if (kind === "symlink") {
        entries.push({
          path,
          mode: "120000",
          type: "blob",
          sha: `${revision}:${path}`,
        })
      } else {
        entries.push({
          path,
          mode: "160000",
          type: "commit",
          sha: `${revision}:${path}`,
        })
      }
    },
  })

  if (inventoryError) throw inventoryError
  if (!archiveRoot || entries.length === 0) {
    throw createTemplateSourceError(
      "source.invalid_response",
      `GitHub returned an empty source archive for ${repository}@${revision}.`
    )
  }

  const extractedDir = join(root, "files")
  await mkdir(extractedDir)
  await tar.x({
    file: tarPath,
    cwd: extractedDir,
    strip: 1,
    filter: (path, rawEntry) => {
      const entry = rawEntry as unknown as TarEntry
      return safeArchivePath(path) && entryType(entry) === "file"
    },
    maxMetaEntrySize: 1024 * 1024,
    strict: true,
  })

  const contentByPath = new Map<string, Uint8Array>()
  for (const entry of entries) {
    if (entry.type !== "blob" || entry.mode === "120000") continue
    const filePath = join(extractedDir, ...entry.path.split("/"))
    const fileStat = await stat(filePath)
    if (!fileStat.isFile() || fileStat.size !== entry.size) {
      throw createTemplateSourceError(
        "source.invalid_response",
        `GitHub returned inconsistent contents for "${entry.path}".`,
        entry.path
      )
    }
    contentByPath.set(entry.path, new Uint8Array(await readFile(filePath)))
  }

  return {
    repository,
    revision,
    entries,
    async readFile(path) {
      const contents = contentByPath.get(path)
      if (!contents) {
        throw createTemplateSourceError(
          "source.file_not_found",
          `File "${path}" is not present in ${repository}@${revision}.`,
          path
        )
      }
      return contents
    },
  }
}

function parseRepository(repository: string): {
  owner: string
  name: string
  canonical: string
} {
  const match = /^([A-Za-z0-9-]+)\/([A-Za-z0-9_.-]+)$/.exec(repository)
  const owner = match?.[1]
  const name = match?.[2]
  if (!owner || !name || owner === "." || name === "." || name === "..") {
    throw createTemplateSourceError(
      "source.invalid_repository",
      `Expected a GitHub repository in owner/repository form, received "${repository}".`
    )
  }

  return {
    owner,
    name,
    canonical: `${owner.toLowerCase()}/${name.toLowerCase()}`,
  }
}

function isSha(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{40}$/i.test(value)
}

/**
 * Resolve public GitHub repositories into immutable commit snapshots by
 * downloading one commit archive and applying descriptor patterns locally.
 */
export function createGitHubTemplateSourceAdapter(
  options: GitHubTemplateSourceOptions = {}
): TemplateSourceAdapter {
  const request = options.fetch ?? fetch
  const apiBaseUrl = (options.apiBaseUrl ?? GITHUB_API_BASE_URL).replace(
    /\/$/,
    ""
  )
  const requestTimeoutMs =
    options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS
  const retryCount = options.retryCount ?? DEFAULT_RETRY_COUNT
  const maxInventoryEntries =
    options.maxInventoryEntries ?? DEFAULT_MAX_INVENTORY_ENTRIES

  async function getJson<T>(url: string): Promise<T> {
    let lastError: unknown

    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)

      try {
        const response = await request(url, {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
          },
          signal: controller.signal,
        })

        if (response.ok) return (await response.json()) as T

        const retryable = response.status === 429 || response.status >= 500
        const error = createTemplateSourceError(
          "source.unavailable",
          `GitHub returned HTTP ${response.status} while reading ${url}.`
        )
        if (!retryable || attempt === retryCount) throw error
        lastError = error
      } catch (error) {
        if (isTemplateSourceError(error)) {
          if (
            !error.message.includes("HTTP 429") &&
            !error.message.includes("HTTP 5")
          ) {
            throw error
          }
          lastError = error
          if (attempt === retryCount) throw error
        } else {
          lastError = error
          if (attempt === retryCount) break
        }
      } finally {
        clearTimeout(timeout)
      }
      await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt))
    }

    throw createTemplateSourceError(
      "source.unavailable",
      `GitHub could not be reached after ${retryCount + 1} attempts: ${String(lastError)}.`
    )
  }

  async function resolveRevision(
    repository: string,
    ref: string
  ): Promise<string> {
    const { owner, name } = parseRepository(repository)
    const url = `${apiBaseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits/${encodeURIComponent(ref)}`
    const response = await getJson<GitHubCommitResponse>(url)
    if (!isSha(response.sha)) {
      throw createTemplateSourceError(
        "source.invalid_response",
        `GitHub returned an invalid commit identity for ${repository}@${ref}.`
      )
    }
    return response.sha.toLowerCase()
  }

  async function resolveDefaultBranch(repository: string): Promise<string> {
    const { owner, name } = parseRepository(repository)
    const url = `${apiBaseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`
    const response = await getJson<GitHubRepositoryResponse>(url)
    if (
      typeof response.default_branch !== "string" ||
      response.default_branch.length === 0
    ) {
      throw createTemplateSourceError(
        "source.invalid_response",
        `GitHub did not return a default branch for ${repository}.`
      )
    }
    return response.default_branch
  }

  return {
    resolveRevision,
    async resolve(source) {
      const { owner, name, canonical } = parseRepository(source.repository)
      const ref = source.ref ?? (await resolveDefaultBranch(source.repository))
      const revision = await resolveRevision(source.repository, ref)
      const archiveUrl = `${apiBaseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/tarball/${revision}`
      const tempDirectory = await mkdtemp(join(tmpdir(), "deesse-template-"))
      const archivePath = join(tempDirectory, "source.tar.gz")

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)
        let response: Response
        try {
          response = await request(archiveUrl, {
            headers: {
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": GITHUB_API_VERSION,
            },
            signal: controller.signal,
          })
          if (!response.ok) {
            throw createTemplateSourceError(
              "source.unavailable",
              `GitHub returned HTTP ${response.status} while downloading ${canonical}@${revision}.`
            )
          }
          await downloadArchive(response, archivePath, MAX_ARCHIVE_SIZE_BYTES)
        } catch (error) {
          if (isTemplateSourceError(error)) throw error
          throw createTemplateSourceError(
            "source.unavailable",
            `GitHub could not download ${canonical}@${revision}: ${String(error)}.`
          )
        } finally {
          clearTimeout(timeout)
        }

        return await readArchiveSnapshot(
          archivePath,
          tempDirectory,
          canonical,
          revision,
          `${name}-${revision}`,
          maxInventoryEntries
        )
      } finally {
        await rm(tempDirectory, { recursive: true, force: true })
      }
    },
  }
}
