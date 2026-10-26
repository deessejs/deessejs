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
  path?: string,
): TemplateSourceError {
  return Object.assign(new Error(message), {
    name: "TemplateSourceError",
    code,
    ...(path ? { path } : {}),
  })
}

export function isTemplateSourceError(error: unknown): error is TemplateSourceError {
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

type GitHubCommitResponse = {
  sha?: unknown
}

type GitHubRepositoryResponse = {
  default_branch?: unknown
}

type GitHubTreeResponse = {
  truncated?: unknown
  tree?: unknown
}

type GitHubBlobResponse = {
  encoding?: unknown
  content?: unknown
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
      `Expected a GitHub repository in owner/repository form, received "${repository}".`,
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

function parseTreeEntry(value: unknown): TemplateSourceEntry | null {
  if (typeof value !== "object" || value === null) return null
  const entry = value as Record<string, unknown>
  if (
    typeof entry.path !== "string" ||
    typeof entry.mode !== "string" ||
    (entry.type !== "blob" && entry.type !== "tree" && entry.type !== "commit") ||
    typeof entry.sha !== "string"
  ) {
    return null
  }

  return {
    path: entry.path,
    mode: entry.mode,
    type: entry.type,
    sha: entry.sha,
    ...(typeof entry.size === "number" ? { size: entry.size } : {}),
  }
}

function decodeBase64(content: string): Uint8Array {
  return Uint8Array.from(Buffer.from(content.replace(/\s/g, ""), "base64"))
}

/**
 * Resolve public GitHub repositories into immutable commit snapshots.
 *
 * The adapter rejects GitHub's truncated recursive tree response instead of
 * returning a plan based on a partial inventory.
 */
export function createGitHubTemplateSourceAdapter(
  options: GitHubTemplateSourceOptions = {},
): TemplateSourceAdapter {
  const request = options.fetch ?? fetch
  const apiBaseUrl = (options.apiBaseUrl ?? GITHUB_API_BASE_URL).replace(/\/$/, "")
  const requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS
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
          `GitHub returned HTTP ${response.status} while reading ${url}.`,
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
      `GitHub could not be reached after ${retryCount + 1} attempts: ${String(lastError)}.`,
    )
  }

  async function resolveRevision(repository: string, ref: string): Promise<string> {
    const { owner, name } = parseRepository(repository)
    const url = `${apiBaseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits/${encodeURIComponent(ref)}`
    const response = await getJson<GitHubCommitResponse>(url)
    if (!isSha(response.sha)) {
      throw createTemplateSourceError(
        "source.invalid_response",
        `GitHub returned an invalid commit identity for ${repository}@${ref}.`,
      )
    }
    return response.sha.toLowerCase()
  }

  async function resolveDefaultBranch(repository: string): Promise<string> {
    const { owner, name } = parseRepository(repository)
    const url = `${apiBaseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`
    const response = await getJson<GitHubRepositoryResponse>(url)
    if (typeof response.default_branch !== "string" || response.default_branch.length === 0) {
      throw createTemplateSourceError(
        "source.invalid_response",
        `GitHub did not return a default branch for ${repository}.`,
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
      const treeUrl = new URL(
        `${apiBaseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/git/trees/${revision}`,
      )
      treeUrl.searchParams.set("recursive", "1")

      const tree = await getJson<GitHubTreeResponse>(treeUrl.toString())
      if (!Array.isArray(tree.tree) || typeof tree.truncated !== "boolean") {
        throw createTemplateSourceError(
          "source.invalid_response",
          `GitHub returned an invalid tree response for ${canonical}@${revision}.`,
        )
      }
      if (tree.truncated) {
        throw createTemplateSourceError(
          "source.incomplete_inventory",
          `GitHub truncated the file inventory for ${canonical}@${revision}.`,
        )
      }
      if (tree.tree.length > maxInventoryEntries) {
        throw createTemplateSourceError(
          "source.inventory_limit_exceeded",
          `The source inventory has ${tree.tree.length} entries, exceeding the limit of ${maxInventoryEntries}.`,
        )
      }

      const entries = tree.tree.map(parseTreeEntry)
      if (entries.some((entry) => entry === null)) {
        throw createTemplateSourceError(
          "source.invalid_response",
          `GitHub returned a malformed tree entry for ${canonical}@${revision}.`,
        )
      }
      const validEntries = entries as TemplateSourceEntry[]
      const filesByPath = new Map(
        validEntries
          .filter((entry) => entry.type === "blob")
          .map((entry) => [entry.path, entry] as const),
      )
      const contentCache = new Map<string, Promise<Uint8Array>>()

      return {
        repository: canonical,
        revision,
        entries: validEntries,
        async readFile(path) {
          const entry = filesByPath.get(path)
          if (!entry) {
            throw createTemplateSourceError(
              "source.file_not_found",
              `File "${path}" is not present in ${canonical}@${revision}.`,
              path,
            )
          }
          if (entry.size !== undefined && entry.size > 10 * 1024 * 1024) {
              throw createTemplateSourceError(
              "source.file_too_large",
              `File "${path}" exceeds the 10 MiB source file limit.`,
              path,
            )
          }

          let contents = contentCache.get(entry.sha)
          if (!contents) {
            contents = (async () => {
              const blobUrl = `${apiBaseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/git/blobs/${entry.sha}`
              const blob = await getJson<GitHubBlobResponse>(blobUrl)
              if (blob.encoding !== "base64" || typeof blob.content !== "string") {
                throw createTemplateSourceError(
                  "source.invalid_response",
                  `GitHub returned unsupported blob content for "${path}".`,
                  path,
                )
              }
              return decodeBase64(blob.content)
            })()
            contentCache.set(entry.sha, contents)
          }
          return contents
        },
      }
    },
  }
}
