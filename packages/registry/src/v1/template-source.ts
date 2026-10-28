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

export type TemplateDescriptorSourceSnapshot = {
  repository: string
  contents: Uint8Array
}

export type TemplateSourceAdapter = {
  resolve(source: TemplateSourceRequest): Promise<TemplateSourceSnapshot>
  resolveDescriptor(
    source: TemplateSourceRequest
  ): Promise<TemplateDescriptorSourceSnapshot>
  resolveRevision(repository: string, ref: string): Promise<string>
}

export type TemplateSourceDiagnosticCode =
  | "source.invalid_repository"
  | "source.unavailable"
  | "source.invalid_response"
  | "source.repository_not_found"
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
const MAX_DESCRIPTOR_SIZE_BYTES = 10 * 1024 * 1024

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

function entryType(entry: {
  type?: string
  mode?: number
}): "file" | "directory" | "symlink" | "unsupported" {
  if (
    entry.type === "Directory" ||
    ((entry.mode ?? 0) & 0o170000) === 0o040000
  ) {
    return "directory"
  }
  if (entry.type === "SymbolicLink") return "symlink"
  if (entry.type === "File" || entry.type === "OldFile") return "file"
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
  expectedArchivePrefix: string,
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
      const entry = rawEntry
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
      const archiveRevision = currentRoot
        .toLowerCase()
        .startsWith(expectedArchivePrefix.toLowerCase())
        ? currentRoot.slice(expectedArchivePrefix.length)
        : ""
      if (
        !/^[a-f0-9]{7,40}$/i.test(archiveRevision) ||
        !revision.toLowerCase().startsWith(archiveRevision.toLowerCase())
      ) {
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
      const entry = rawEntry
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
 * Resolve public GitHub sources for archive-based installation or read only
 * the root descriptor for quick inspection.
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

  async function getJson(url: string): Promise<unknown> {
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

        if (response.ok) return await response.json()

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
    const response = await getJson(url)
    const sha =
      typeof response === "object" && response !== null && "sha" in response
        ? response.sha
        : undefined
    if (!isSha(sha)) {
      throw createTemplateSourceError(
        "source.invalid_response",
        `GitHub returned an invalid commit identity for ${repository}@${ref}.`
      )
    }
    return sha.toLowerCase()
  }

  async function resolveDefaultBranch(repository: string): Promise<string> {
    const { owner, name } = parseRepository(repository)
    const url = `${apiBaseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`
    const response = await getJson(url)
    const defaultBranch =
      typeof response === "object" &&
      response !== null &&
      "default_branch" in response
        ? response.default_branch
        : undefined
    if (typeof defaultBranch !== "string" || defaultBranch.length === 0) {
      throw createTemplateSourceError(
        "source.invalid_response",
        `GitHub did not return a default branch for ${repository}.`
      )
    }
    return defaultBranch
  }

  async function repositoryExists(repository: string): Promise<boolean> {
    const { owner, name } = parseRepository(repository)
    const url = `${apiBaseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`
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
      if (response.status === 404) return false
      if (!response.ok) {
        throw createTemplateSourceError(
          "source.unavailable",
          `GitHub returned HTTP ${response.status} while checking ${repository}.`
        )
      }
      return true
    } finally {
      clearTimeout(timeout)
    }
  }

  async function readRemoteDescriptor(
    repository: string,
    ref: string | undefined
  ): Promise<Uint8Array> {
    const { owner, name } = parseRepository(repository)
    const refQuery = ref ? `?ref=${encodeURIComponent(ref)}` : ""
    const url = `${apiBaseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/contents/deesse-template.json${refQuery}`
    let lastError: unknown

    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
      try {
        return await fetchRemoteDescriptor(
          url,
          repository,
          request,
          requestTimeoutMs
        )
      } catch (error) {
        if (isTemplateSourceError(error)) {
          if (error.code !== "source.unavailable") throw error
          const retryableHttpError =
            error.message.includes("HTTP 429") ||
            /HTTP 5\d\d/.test(error.message)
          if (!retryableHttpError || attempt === retryCount) throw error
          lastError = error
        } else {
          lastError = error
          if (attempt === retryCount) break
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt))
    }

    throw createTemplateSourceError(
      "source.unavailable",
      `GitHub could not read the root descriptor from ${repository}${ref ? ` at ref ${ref}` : ""}: ${String(lastError)}.`
    )
  }

  async function fetchRemoteDescriptor(
    url: string,
    repository: string,
    fetcher: typeof fetch,
    timeoutMs: number
  ): Promise<Uint8Array> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetcher(url, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": GITHUB_API_VERSION,
        },
        signal: controller.signal,
      })
      if (response.status === 404) {
        throw createTemplateSourceError(
          "source.file_not_found",
          `File "deesse-template.json" is not present in ${repository}.`,
          "deesse-template.json"
        )
      }
      if (!response.ok) {
        throw createTemplateSourceError(
          "source.unavailable",
          `GitHub returned HTTP ${response.status} while reading ${url}.`
        )
      }
      const payload: unknown = await response.json()
      if (!isRecord(payload)) {
        throw createTemplateSourceError(
          "source.invalid_response",
          "GitHub returned an invalid deesse-template.json response.",
          "deesse-template.json"
        )
      }
      const file = payload
      if (file.type !== "file") {
        throw createTemplateSourceError(
          "source.invalid_response",
          `The root deesse-template.json in ${repository} must be a regular file.`,
          "deesse-template.json"
        )
      }
      if (
        typeof file.size === "number" &&
        file.size > MAX_DESCRIPTOR_SIZE_BYTES
      ) {
        throw createTemplateSourceError(
          "source.file_too_large",
          `The root deesse-template.json exceeds the ${MAX_DESCRIPTOR_SIZE_BYTES} byte limit.`,
          "deesse-template.json"
        )
      }
      if (file.encoding !== "base64" || typeof file.content !== "string") {
        throw createTemplateSourceError(
          "source.invalid_response",
          "GitHub did not return base64-encoded root descriptor contents.",
          "deesse-template.json"
        )
      }
      const encoded = file.content.replace(/\s/g, "")
      if (
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
          encoded
        )
      ) {
        throw createTemplateSourceError(
          "source.invalid_response",
          "GitHub returned invalid base64 contents for the root descriptor.",
          "deesse-template.json"
        )
      }
      const contents = new Uint8Array(Buffer.from(encoded, "base64"))
      if (contents.byteLength > MAX_DESCRIPTOR_SIZE_BYTES) {
        throw createTemplateSourceError(
          "source.file_too_large",
          `The root deesse-template.json exceeds the ${MAX_DESCRIPTOR_SIZE_BYTES} byte limit.`,
          "deesse-template.json"
        )
      }
      return contents
    } finally {
      clearTimeout(timeout)
    }
  }

  return {
    resolveRevision,
    async resolveDescriptor(source) {
      const { canonical } = parseRepository(source.repository)
      try {
        const contents = await readRemoteDescriptor(canonical, source.ref)
        return { repository: canonical, contents }
      } catch (error) {
        if (
          !isTemplateSourceError(error) ||
          error.code !== "source.file_not_found"
        ) {
          throw error
        }

        if (!(await repositoryExists(canonical))) {
          throw createTemplateSourceError(
            "source.repository_not_found",
            `GitHub repository "${canonical}" does not exist or is not publicly accessible.`
          )
        }
        throw error
      }
    },
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
          `${owner}-${name}-`,
          maxInventoryEntries
        )
      } finally {
        await rm(tempDirectory, { recursive: true, force: true })
      }
    },
  }
}
